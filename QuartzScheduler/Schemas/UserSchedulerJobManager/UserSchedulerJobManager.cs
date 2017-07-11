namespace Terrasoft.Configuration.Assistant
{
	using System;
	using System.Collections.Generic;
	using System.Data;
	using Terrasoft.Common;
	using Terrasoft.Core;
	using Terrasoft.Core.DB;
	using Terrasoft.Core.Scheduler;
	using Quartz;

	#region Class: UserSchedulerJobManager

	public class UserSchedulerJobManager
	{

		#region Private Class: BaseJobData

		private abstract class BaseJobData
		{
			protected BaseJobData(UserConnection userConnection) {
				WorkspaceName = userConnection.Workspace.Name;
				UserName = userConnection.CurrentUser.Name;
			}

			public string JobName { get; set; }
			public string JobGroup { get; set; }
			public string WorkspaceName { get; private set; }
			public string UserName { get; private set; }
			public int PeriodInMinute { get; set; }
			public IDictionary<string, object> Parameters { get; set; }

			public abstract void RunMinutely();

			public abstract void RunImmediate();

			public abstract BaseJobData RunOnEveryDay(DateTime dateTime);

			public virtual bool Remove() {
				return AppScheduler.RemoveJob(JobName, JobGroup);
			}

			public virtual void Pause() {
				AppScheduler.Instance.PauseJob(JobKey.Create(JobName, JobGroup));
			}

			public virtual void Resume() {
				AppScheduler.Instance.ResumeJob(JobKey.Create(JobName, JobGroup));
			}

			public void AddTask(UserConnection userConnection, Guid actionId, DateTime dateTime) {
				var insert = new Insert(userConnection)
					.Into("AssistantTask")
					.Set("Name", Column.Parameter(JobName))
					.Set("ActionId", Column.Parameter(actionId))
					.Set("SysAdminUnitId", Column.Parameter(userConnection.CurrentUser.Id))
					.Set("RunDateTime", Column.Parameter(dateTime))
					.Set("TypeId", Column.Parameter("53A1127D-B0C3-435B-9268-938F6678FDC2")) as Insert;
				insert.Execute();

			}
		}

		#endregion

		#region Private Class: UserSchedulerJobManager

		private class ProcessJobData : BaseJobData
		{
			public ProcessJobData(UserConnection userConnection)
				: base(userConnection) {

			}

			public string ProcessName { get; set; }

			public override void RunMinutely() {
				AppScheduler.ScheduleMinutelyProcessJob(JobName, JobGroup, ProcessName,
					WorkspaceName, UserName, PeriodInMinute, Parameters);
			}

			public override void RunImmediate() {
				AppScheduler.ScheduleImmediateProcessJob(JobName, JobGroup, ProcessName,
					WorkspaceName, UserName, Parameters);
			}

			public override BaseJobData RunOnEveryDay(DateTime dateTime) {
				ITrigger trigger = TriggerBuilder.Create()
					.WithDailyTimeIntervalSchedule(
						interval => interval
							.WithIntervalInHours(24)
							.OnEveryDay()
							.StartingDailyAt(TimeOfDay.HourAndMinuteOfDay(dateTime.Hour, dateTime.Minute))
					).Build();
				var job = AppScheduler.CreateProcessJob(JobName, JobGroup, ProcessName,
					WorkspaceName, UserName, Parameters);
				AppScheduler.Instance.ScheduleJob(job, trigger);
				return this;
			}

		}

		#endregion

		#region Class: UserJobInfo
		[Serializable]
		public class UserJobInfo
		{
			public string GropName;
			public string Name;
			public string Description;
			public string TriggerTypeName;
			public string TriggerStage;
			public DateTime NextFireTime;
			public DateTime PrevFireTime;

		}

		#endregion

		#region Constructors: Public

		public UserSchedulerJobManager(UserConnection userConnection) {
			UserConnection = userConnection;
		}

		#endregion

		#region Properties: Protected

		protected UserConnection UserConnection { get; private set; }

		private QuartzSchedulerInfoProxy _infoProxy;
		protected QuartzSchedulerInfoProxy InfoProxy {
			get { return _infoProxy ?? (_infoProxy = new QuartzSchedulerInfoProxy()); }
			private set { _infoProxy = value; }
		}

		#endregion

		#region Methods: Private

		private IEnumerable<UserJobInfo> ToUserJobList(JobInfo[] jobsInfo) {
			var userJiList = new List<UserJobInfo>();
			jobsInfo.ForEach(jobInfo => userJiList.Add(CreateUserJobInfo(jobInfo)));
			return userJiList;
		}

		private UserJobInfo CreateUserJobInfo(JobInfo jobInfo) {
			var userJi = new UserJobInfo {
				Name = jobInfo.Name,
				GropName = jobInfo.GropName,
				Description = jobInfo.Description,
				TriggerTypeName = jobInfo.TriggerTypeName,
				TriggerStage = jobInfo.TriggerStage,
				NextFireTime = ToUserTime(jobInfo.NextFireTime),
				PrevFireTime = ToUserTime(jobInfo.PrevFireTime)
			};
			return userJi;
		}

		private DateTime ToUserTime(DateTimeOffset? dateTimeOffset) {
			return dateTimeOffset.HasValue
				? dateTimeOffset.Value.GetDateTime(UserConnection.CurrentUser.TimeZone)
				: DateTime.MinValue;
		}

		private bool DeleteTask(Guid actionId) {
			var delete = new Delete(UserConnection)
						.From("AssistantTask")
						.Where("ActionId").IsEqual(Column.Parameter(actionId))
						.And("SysAdminUnitId").IsEqual(Column.Parameter(UserConnection.CurrentUser.Id));
			using (var dbExecutor = UserConnection.EnsureDBConnection()) {
				delete.Execute(dbExecutor);
			}
			return true;
		}

		private BaseJobData GetActionData(Guid actionId) {
			var select = new Select(UserConnection)
				.Column("ProcessName")
				.From("AssistantAction")
				.Where("Id")
				.IsEqual(Column.Parameter(actionId)) as Select;
			var processName = string.Empty;
			using (DBExecutor dbExecutor = UserConnection.EnsureDBConnection()) {
				using (IDataReader reader = dbExecutor.ExecuteReader(select.GetSqlText(), select.Parameters)) {
					while (reader.Read()) {
						processName = reader.GetColumnValue<string>("ProcessName");
					}
				}
			}
			var jobData = new ProcessJobData(UserConnection) {
				ProcessName = processName,
				JobName = processName + "JobName_" + Guid.NewGuid(),
				JobGroup = processName + "GroupName"
			};
			return jobData;
		}

		#endregion

		#region Methods: Protected

		protected Select GetTasksSelect(Guid userId) {
			var select = new Select(UserConnection)
				.Column("Name").As("JobName")
				.From("AssistantTask")
				.Where("SysAdminUnitId")
				.IsEqual(Column.Parameter(userId)) as Select;
			return select;
		}

		protected string[] GetKeys() {
			var keys = new List<string>();
			var select = GetTasksSelect(UserConnection.CurrentUser.Id);
			using (DBExecutor dbExecutor = UserConnection.EnsureDBConnection()) {
				using (IDataReader reader = dbExecutor.ExecuteReader(select.GetSqlText(), select.Parameters)) {
					while (reader.Read()) {
						keys.Add(reader.GetColumnValue<string>("JobName"));
					}
				}
			}
			return keys.ToArray();
		}

		#endregion

		#region Methods: Public

		public IEnumerable<UserJobInfo> GetJobInfos() {
			var jobsList = InfoProxy.GetJobsInfoByList(GetKeys());
			return ToUserJobList(jobsList);
		}

		public bool RunMinutelyAction(Guid actionId) {
			try {
				GetActionData(actionId).RunMinutely();
			} catch {
				return false;
			}
			return true;
		}

		public bool RunImmediateAction(Guid actionId) {
			try {
				GetActionData(actionId).RunImmediate();
			} catch {
				return false;
			}
			return true;
		}

		public bool RunOnEveryDay(Guid actionId, DateTime dateTime) {
			try {
				GetActionData(actionId).RunOnEveryDay(dateTime).AddTask(UserConnection, actionId, dateTime);
			} catch {
				return false;
			}
			return true;
		}

		public bool RemoveAction(Guid actionId) {
			try {
				return GetActionData(actionId).Remove() && DeleteTask(actionId);
			} catch {
				return false;
			}
		}

		public bool PauseAction(Guid actionId) {
			try {
				GetActionData(actionId).Pause();
			} catch {
				return false;
			}
			return true;
		}

		public bool ResumeAction(Guid actionId) {
			try {
				GetActionData(actionId).Resume();
			} catch {
				return false;
			}
			return true;
		}

		#endregion

	}

	#endregion

}


