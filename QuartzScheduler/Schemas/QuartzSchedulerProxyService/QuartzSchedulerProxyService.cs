namespace Terrasoft.Configuration.Assistant
{
	using System.ServiceModel;
	using System.ServiceModel.Web;
	using System.ServiceModel.Activation;
	using System.Web;
	using Terrasoft.Core;
	using System;
	using System.Collections.Generic;
	using CoreSysSettings = Terrasoft.Core.Configuration.SysSettings;

	[ServiceContract]
	[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
	public class QuartzSchedulerProxyService
	{
		#region Methods: Public

		[OperationContract]
		[WebInvoke(Method = "POST", BodyStyle = WebMessageBodyStyle.Wrapped,
			RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
		public IEnumerable<UserSchedulerJobManager.UserJobInfo> GetJobInfo() {
			var userConnection = (UserConnection)HttpContext.Current.Session["UserConnection"];
			var jManager = new UserSchedulerJobManager(userConnection);
			return jManager.GetJobInfos();
		}

		[OperationContract]
		[WebInvoke(Method = "POST", BodyStyle = WebMessageBodyStyle.Wrapped,
			RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
		public bool RunOnEveryDayAction(Guid actionId, DateTime dateTime) {
			var userConnection = (UserConnection)HttpContext.Current.Session["UserConnection"];
			var jManager = new UserSchedulerJobManager(userConnection);
			return jManager.RunOnEveryDay(actionId, dateTime);
		}

		[OperationContract]
		[WebInvoke(Method = "POST", BodyStyle = WebMessageBodyStyle.Wrapped,
			RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
			public bool RunImmediateAction(Guid actionId) {
			var userConnection = (UserConnection)HttpContext.Current.Session["UserConnection"];
			var jManager = new UserSchedulerJobManager(userConnection);
			return jManager.RunImmediateAction(actionId);
		}

		#endregion
	}
}
