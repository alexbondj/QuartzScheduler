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
	public class AssistantService
	{
		#region Methods: Public

		[OperationContract]
		[WebInvoke(Method = "POST", BodyStyle = WebMessageBodyStyle.Wrapped,
			RequestFormat = WebMessageFormat.Json, ResponseFormat = WebMessageFormat.Json)]
		public JobInfo[] TestMethod() {
			//Test service
			var qp = new QuartzSchedulerInfoProxy();
			return qp.GetJobsInfoByList(new[] { "Terrasoft.Configuration.NotificationsJob" });
		}

		#endregion
	}
}
