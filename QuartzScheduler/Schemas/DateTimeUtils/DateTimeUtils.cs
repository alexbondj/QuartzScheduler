namespace Terrasoft.Configuration.Assistant
{
	using System;

	#region Class: DateTimeUtils

	public static class DateTimeUtils
	{

		#region Methods: Public

		public static DateTime GetDateTime(this DateTimeOffset dto, TimeZoneInfo timeZone) {
			return TimeZoneInfo.ConvertTimeFromUtc(dto.DateTime, timeZone);
		}

		#endregion

	}

	#endregion

}