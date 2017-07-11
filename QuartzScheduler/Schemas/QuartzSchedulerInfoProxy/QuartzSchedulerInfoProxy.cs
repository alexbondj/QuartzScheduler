namespace Terrasoft.Configuration.Assistant
{
	using System;
	using System.Collections.Generic;
	using System.Linq;
	using Terrasoft.Core.Scheduler;
	using Quartz;
	using Quartz.Impl.Matchers;
	using QuartzCollection = Quartz.Collection;

	#region Struct: JobInfo
	[Serializable]
	public struct JobInfo
	{
		public string GropName;
		public string Name;
		public string Description;
		public string TriggerName;
		public string TriggerGroup;
		public string TriggerTypeName;
		public string TriggerStage;
		public DateTimeOffset? NextFireTime;
		public DateTimeOffset? PrevFireTime;

	}

	#endregion

	#region Class: QuartzSchedulerInfoProxy

	public class QuartzSchedulerInfoProxy
	{

		#region Methods: Private

		private static IList<JobInfo> GetAllJobs(IScheduler scheduler) {
			IList<string> jobGroups = scheduler.GetJobGroupNames();
			IList<JobInfo> jobsList = new List<JobInfo>();
			foreach (string group in jobGroups) {
				var groupMatcher = GroupMatcher<JobKey>.GroupContains(group);
				var jobKeys = scheduler.GetJobKeys(groupMatcher);
				foreach (var jobKey in jobKeys) {
					var detail = scheduler.GetJobDetail(jobKey);
					var triggers = scheduler.GetTriggersOfJob(jobKey);
					foreach (ITrigger trigger in triggers) {
						DateTimeOffset? nextFireTime = trigger.GetNextFireTimeUtc();
						DateTimeOffset? previousFireTime = trigger.GetPreviousFireTimeUtc();
						jobsList.Add(new JobInfo {
							GropName = group,
							Name = jobKey.Name,
							Description = detail.Description,
							TriggerName = trigger.Key.Name,
							TriggerGroup = trigger.Key.Group,
							TriggerTypeName = trigger.GetType().Name,
							TriggerStage = scheduler.GetTriggerState(trigger.Key).ToString(),
							NextFireTime = nextFireTime,
							PrevFireTime = previousFireTime
						});
					}
				}
			}
			return jobsList;
		}

		#endregion

		#region Methods: Public

		public JobInfo[] GetAllJobsInfo() {
			return GetAllJobs(AppScheduler.Instance).ToArray();
		}

		public JobInfo[] GetJobsInfoByList(string[] jobsName) {
			var list = GetAllJobs(AppScheduler.Instance);
			return list.Where(jobInfo => jobsName.Contains(jobInfo.Name)).ToArray();
		} 

		#endregion
	}

	#endregion

}
