define("JobItemSchema", ["JobItemSchemaResources", "NetworkUtilities", "FormatUtils",
        "EmailConstants", "ConfigurationEnums", "ConfigurationConstants", "ProcessModuleUtilities", "RightUtilities",
        "BusinessRuleModule", "LookupQuickAddMixin", "EntityConnectionLinksPanelItemUtilities"],
    function(resources, NetworkUtilities, FormatUtils, EmailConstants, ConfigurationEnums,
             ConfigurationConstants, ProcessModuleUtilities, RightUtilities, BusinessRuleModule) {
        return {
            entitySchemaName: "AssistantTask",
            mixins: { },
            messages: {},
            attributes: {
                JobName: {
                    dataValueType: Terrasoft.DataValueType.TEXT,
                    type: Terrasoft.ViewModelColumnType.ENTITY_COLUMN
                },
                ActionName: {
                    dataValueType: Terrasoft.DataValueType.TEXT,
                    type: Terrasoft.ViewModelColumnType.ENTITY_COLUMN
                },
                TypeName: {
                    dataValueType: Terrasoft.DataValueType.TEXT,
                    type: Terrasoft.ViewModelColumnType.ENTITY_COLUMN
                }
            },
            methods: { },
            diff: [
                {
                    "operation": "insert",
                    "name": "TaskHeader",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        classes: {wrapClassName: ["messageHeader"]},
                        items: []
                    }
                },
                {
                    "operation": "insert",
                    "name": "JobNameContainer",
                    "parentName": "TaskHeader",
                    "propertyName": "items",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        classes: {wrapClassName: ["createdBy"]},
                        items: []
                    }
                },
                {
                    "operation": "insert",
                    "parentName": "JobNameContainer",
                    "propertyName": "items",
                    "name": "JobName",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.LABEL,
                        "caption": {bindTo: "JobName"},
                        "classes": {
                            "labelClass": ["t-label"]
                        }
                    }
                },
                {
                    "operation": "insert",
                    "name": "TaskMessage",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "classes": {"wrapClassName": ["message-container"]},
                        "items": []
                    }
                },
                {
                    "operation": "insert",
                    "name": "TitleContainer",
                    "parentName": "TaskMessage",
                    "propertyName": "items",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "classes": {wrapClassName: ["title-container"]},
                        "items": []
                    }
                },
                {
                    "operation": "insert",
                    "parentName": "TitleContainer",
                    "propertyName": "items",
                    "name": "ActionName",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.LABEL,
                        "caption": {bindTo: "ActionName"},
                        "classes": {
                            "labelClass": ["t-label", "message-title", "messageHeader"]
                        }
                    }
                },
                {
                    "operation": "insert",
                    "name": "TypeNameContainer",
                    "parentName": "TaskMessage",
                    "propertyName": "items",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "classes": {"wrapClassName": ["message-text-container"]},
                        "items": []
                    }
                },
                {
                    "operation": "insert",
                    "parentName": "TypeNameContainer",
                    "propertyName": "items",
                    "name": "TypeName",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.LABEL,
                        "caption": {bindTo: "TypeName"},
                        "classes": {
                            "labelClass": ["t-label"]
                        }
                    }
                }

            ]
        };
    });
