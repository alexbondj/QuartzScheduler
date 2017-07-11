define("AssistantScriptPage", ["ExtendedHtmlEditModule"], function() {
	return {
		entitySchemaName: "AssistantScript",
		methods: {
			/**
			 * @inheritdoc Terrasoft.BasePageV2#init
			 * @overridden
			 */
			init: function() {
				this.callParent(arguments);
			},

			save: function() {
				this.setDefaultValues();
				this.callParent(arguments);
			},

			execute: function() {
				var config = this.getServiceConfig();
				this.callService(config, function(response) {
					var result = response.ExecuteResult;
					var message = result.success
						? result.Value || "Done."
						: result.errorInfo.message;
					this.showInformationDialog(message, this.Terrasoft.emptyFn);
				});
			},

			getServiceConfig: function() {
				return {
					serviceName: "LuaExecutorService",
					methodName: "Execute",
					scope: this,
					data: {
						code: this.get("Code")
					}
				};
			}
		},
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "insert",
				"parentName": "HeaderContainer",
				"propertyName": "items",
				"name": "Execute",
				"values": {
					"click": {
						"bindTo": "execute"
					},
					"itemType": this.Terrasoft.ViewItemType.BUTTON,
					"style": this.Terrasoft.controls.ButtonEnums.style.DEFAULT,
					"caption": {
						"bindTo": "Resources.Strings.ExecuteButtonCaption"
					}
				}
			},
			{
				"operation": "insert",
				"name": "Name",
				"values": {
					"bindTo": "Name",
				},
				"parentName": "HeaderContainer",
				"propertyName": "items"
			},
			{
				"operation": "insert",
				"parentName": "HeaderContainer",
				"propertyName": "items",
				"name": "Code",
				"values": {
					"contentType": this.Terrasoft.ContentType.LONG_TEXT,
					"labelConfig": {
						"visible": false
					},
					"value": {"bindTo": "Code"},
					"height": "500px"
				}
			}
		]/**SCHEMA_DIFF*/
	};
});
