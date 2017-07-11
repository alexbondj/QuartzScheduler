define("AssistantSchema", ["RightUtilities", "ModalBox", "AssistantSchemaResources", "css!AssistantSchema"],
    function(RightUtilities, ModalBox) {
        return {
            messages: {
            },
            mixins: {
                rightsUtilities: "Terrasoft.RightUtilitiesMixin"
            },
            attributes: {
                "ActionCollection": {
                    "dataValueType": this.Terrasoft.DataValueType.COLLECTION
                },
                "ActionTabActionsMenuCollection": {
                    "dataValueType": this.Terrasoft.DataValueType.COLLECTION
                },
                "AddItemMenuCollection": {
                    "dataValueType": this.Terrasoft.DataValueType.COLLECTION
                },
                "ItemViewConfig": {
                    dataValueType: this.Terrasoft.DataValueType.CUSTOM_OBJECT
                },
                "SchemaGeneratorConfig": {
                    dataValueType: this.Terrasoft.DataValueType.CUSTOM_OBJECT
                },
                Action: {
                    dataValueType: Terrasoft.DataValueType.LOOKUP,
                    type: Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN
                },
                actionList: {
                    "dataValueType": this.Terrasoft.DataValueType.COLLECTION,
                    value: new Terrasoft.Collection()
                },
                runTime: {
                    type: Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
                    dataValueType: Terrasoft.DataValueType.DATE
                },
                IsDailyVisible: {
                    type: Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
                    dataValueType: Terrasoft.DataValueType.BOOLEAN,
                    value: false
                },
                IsImmediateVisible: {
                    type: Terrasoft.ViewModelColumnType.VIRTUAL_COLUMN,
                    dataValueType: Terrasoft.DataValueType.BOOLEAN,
                    value: false
                }
            },
            methods: {

                onGetItemConfig: function(itemConfig) {
                    var viewConfig = this.Terrasoft.deepClone(this.get("ItemViewConfig"));
                    itemConfig.config = viewConfig;
                },

                /**
                 * Initializes the schema.
                 */
                init: function(callback) {
                    this.initParameters();
                    this.callParent([function() {
                        Terrasoft.chain(
                            this.initRights,
                            this.initActionTabActionsMenuCollection,
                            this.initAddItemMenuCollection,
                            this.buildSchema,
                            function() {
                                this.loadData();
                                callback();
                            }, this);
                    }, this]);
                },

                initRights: function(callback, scope) {
                    RightUtilities.checkCanExecuteOperation({
                        operation: "AssistantDevMode"
                    }, function(result) {
                        this.setIsDevMode(result);
                        if (!this.Ext.isEmpty(callback)) {
                            callback.call(scope || this);
                        }
                    }, this);
                },

                setIsDevMode: function(value) {
                    this.set("isRunScriptItemVisible", value);
                    this.set("isDevMode", value);
                },

                showAddDaily: function() {
                    this.set("IsDailyVisible", true);
                },

                showImmediate: function() {
                    this.set("IsImmediateVisible", true);
                },

                cancel: function() {
                    this.set("IsDailyVisible", false);
                    this.set("IsImmediateVisible", false);
                },

                addDailyAction: function(actionId, dateTime) {
                    var config = {
                        serviceName: "QuartzSchedulerProxyService",
                        methodName: "RunOnEveryDayAction",
                        scope: this,
                        data: {
                            "actionId": actionId,
                            "dateTime": dateTime
                        }
                    };
                    this.set("IsDailyVisible", false);
                    this.callService(config, this.onRefreshData, this);
                },

                addImmediate: function(actionId) {
                    var action = this.get("Action").value;
                    this.addImmediateAction(action);
                },

                addImmediateAction: function(actionId) {
                    var config = {
                        serviceName: "QuartzSchedulerProxyService",
                        methodName: "RunImmediateAction",
                        scope: this,
                        data: {
                            "actionId": actionId
                        }
                    };
                    this.set("IsImmediateVisible", false);
                    this.callService(config, this.onRefreshData, this);
                },

                addDaily: function() {
                    var action = this.get("Action").value;
                    var dateTime = this.get("runTime");
                    dateTime = "/Date(" + dateTime.toJSON() + ")\/";
                    this.addDailyAction(action, dateTime);
                },

                initAddItemMenuCollection: function(callback, scope) {
                    var collection = this.get("AddItemMenuCollection") ||
                        this.Ext.create("Terrasoft.BaseViewModelCollection");
                    var addImmediateCaption = "Add immediate action";
                    var addImmediateItem = this.getButtonMenuItem({
                        "Caption": addImmediateCaption,
                        "Click": {bindTo: "showImmediate"}
                    });
                    collection.addItem(addImmediateItem);
                    var addDailyCaption = this.get("Resources.Strings.AddDailyCaption");
                    var addDailyItem = this.getButtonMenuItem({
                        "Caption": addDailyCaption,
                        "Click": {bindTo: "showAddDaily"}
                    });


                    collection.addItem(addDailyItem);
                    this.set("AddItemMenuCollection", collection);
                    if (!this.Ext.isEmpty(callback)) {
                        callback.call(scope || this);
                    }
                },

                initActionTabActionsMenuCollection: function(callback, scope) {
                    var collection = this.get("ActionTabActionsMenuCollection") ||
                        this.Ext.create("Terrasoft.BaseViewModelCollection");
                    var refreshCaption = this.get("Resources.Strings.RefreshCaption");
                    var refreshItem = this.getButtonMenuItem({
                        "Caption": refreshCaption,
                        "Click": {bindTo: "onRefreshData"}
                    });
                    collection.addItem(refreshItem);
                    var executeLuaScriptCaption = this.get("Resources.Strings.ExecuteLuaScriptCaption");
                    var executeLuaScriptItem = this.getButtonMenuItem({
                        "Caption": executeLuaScriptCaption,
                        "Click": { "bindTo": "showRunScriptWindow" },
                        //"canExecute": { "bindTo": "isDevMode" },
                        "Visible": { "bindTo": "isRunScriptItemVisible" }
                    });
                    collection.addItem(executeLuaScriptItem);
                    this.set("ActionTabActionsMenuCollection", collection);
                    if (!this.Ext.isEmpty(callback)) {
                        callback.call(scope || this);
                    }
                },

                showRunScriptWindow: function() {
                    var modalBoxSize = {
                       minHeight: "75",
                       minWidth: "10",
                       maxHeight: "300",
                       maxWidth: "50"
                   };
                   var modalBoxContainer = ModalBox.show(modalBoxSize);
                   this.sandbox.loadModule("CredentialsSyncSettingsEdit", {
                       renderTo: modalBoxContainer,
                       instanceConfig: {
                           schemaName: "LuaScriptEdit",
                           isSchemaConfigInitialized: true,
                           useHistoryState: false
                       }
                   });
                },

                initParameters: function() {
                    this.set("ActionCollection", this.Ext.create("Terrasoft.BaseViewModelCollection"));
                    this.set("SchemaGeneratorConfig", {
                        schemaName: "JobItemSchema",
                        profileKey: "JobItemSchema"
                    });
                },

                /**
                 * Load data
                 * @protected
                 * @param {Boolean} clearCollection Clear existing emails list flag.
                 */
                loadData: function(clearCollection) {
                    var esq = this.Ext.create("Terrasoft.EntitySchemaQuery", {
                        rootSchemaName: "AssistantTask"
                    });
                    this.addEsqColumns(esq);
                    this.addFilters(esq);
                    var rowCount = this.get("RowCount");
                    var config = {
                        collection: this.get("ActionCollection"),
                        primaryColumnName: "Id",
                        schemaQueryColumns: esq.columns,
                        isPageable: true,
                        rowCount: rowCount,
                        isClearGridData: clearCollection
                    };
                    this.initializePageableOptions(esq, config);
                    this.set("IsDataLoaded", false);
                    esq.getEntityCollection(function(result) {
                        this.getDataFromQRTZ(function (qData) {
                            this.onActionLoaded(result, clearCollection, qData);
                        }, this);
                    }, this);
                },

                getDataFromQRTZ: function(callback, scope) {
                    var config = {
                        serviceName: "QuartzSchedulerProxyService",
                        methodName: "GetJobInfo",
                        scope: this,
                        data: {}
                    };
                    this.callService(config, function(result) {
                        if(callback) {
                            callback.call(scope || this, result);
                        }
                    }, this);
                },

                buildSchema: function(callback, scope) {
                    var schemaBuilder = this.Ext.create("Terrasoft.SchemaBuilder");
                    var generatorConfig = this.Terrasoft.deepClone(this.get("SchemaGeneratorConfig"));
                    schemaBuilder.build(generatorConfig, function(viewModelClass, viewConfig) {
                        this.set("ViewModelClass", viewModelClass);
                        var view = {
                            "id": "jobItemContainer",
                            //"classes": {wrapClassName: ["email-container"]},
                            "items": [{
                                "className": "Terrasoft.Container",
                                "items": viewConfig
                            }]
                        };
                        this.set("ItemViewConfig", view);
                        callback.call(scope);
                    }, this);
                },

                addEsqColumns: function(esq) {
                    esq.addColumn("Name", "JobName");
                    esq.addColumn("Action.Name", "ActionName");
                    esq.addColumn("Type.Name", "TypeName");
                },

                addFilters: function(esq) {
                    var filters = this.Terrasoft.createFilterGroup();
                    filters.add("isMine",
                        esq.createColumnFilterWithParameter(Terrasoft.ComparisonType.EQUAL,
                            "SysAdminUnit", Terrasoft.SysValue.CURRENT_USER.value));
                    esq.filters = filters;
                },

                onRefreshData: function() {
                    this.loadData(true);
                },

                onLoadEntity: function(entity, viewModel, qData) {
                    viewModel = viewModel || this.getTaskViemModelInstance();
                    viewModel.setColumnValues(entity, {preventValidation: true});
                    viewModel.init();
                    //this.subscribeModelEvents(viewModel);
                    return viewModel;
                },

                onActionLoaded: function(result, clearCollection, qData) {
                    if (result.success) {
                        var dataCollection = result.collection;
                        this.set("CanLoadMoreData", dataCollection.getCount() > 0);
                        var data = this.Ext.create("Terrasoft.BaseViewModelCollection");
                        dataCollection.each(function(item) {
                            var model = this.onLoadEntity(item, null, qData);
                            data.add(item.get("Id"), model);
                        }, this);
                        var collection = this.get("ActionCollection");
                        if (clearCollection) {
                            collection.clear();
                        }
                        collection.loadAll(data);
                    }
                    this.hideBodyMask();
                    this.set("IsDataLoaded", true);
                },

                getTaskViemModelInstance: function() {
                    var viewModelClass = this.getViewModelClass();
                    var viewModel = this.Ext.create(viewModelClass, {
                        Ext: this.Ext,
                        sandbox: this.sandbox,
                        Terrasoft: this.Terrasoft,
                        values: {}
                    });
                    return viewModel;
                },

                getViewModelClass: function() {
                    var viewModelClass = this.get("ViewModelClass");
                    return this.Terrasoft.deepClone(viewModelClass);
                },

                /**
                 * Schema destroying event handler.
                 */
                onDestroyed: function() {
                },

                getEmptyMessageConfig: function(config) {
                    config.className = "Terrasoft.Label";
                    config.caption = "No active tasks"//this.get("Resources.Strings.NoEmailsInFolder");
                    config.classes = {
                        "labelClass": ["email-empty-message"]
                    };
                },

                initializePageableOptions: function(select, config) {
                    var isPageable = config.isPageable;
                    select.isPageable = isPageable;
                    var rowCount = config.rowCount;
                    select.rowCount = isPageable ? rowCount : -1;
                    if (!isPageable) {
                        return;
                    }
                    var collection = config.collection;
                    var primaryColumnName = config.primaryColumnName;
                    var schemaQueryColumns = config.schemaQueryColumns;
                    var isClearGridData = config.isClearGridData;
                    var conditionalValues = null;
                    var loadedRecordsCount = collection.getCount();
                    if (Terrasoft.useOffsetFetchPaging) {
                        select.rowsOffset = isClearGridData ? 0 : loadedRecordsCount;
                    } else {
                        var isNextPageLoading = (loadedRecordsCount > 0 && !isClearGridData);
                        if (isNextPageLoading) {
                            var lastRecord = config.lastRecord ||
                                collection.getByIndex(loadedRecordsCount - 1);
                            var columnDataValueType = this.getDataValueType(lastRecord, primaryColumnName);
                            conditionalValues = this.Ext.create("Terrasoft.ColumnValues");
                            conditionalValues.setParameterValue(primaryColumnName,
                                lastRecord.get(primaryColumnName), columnDataValueType);
                            schemaQueryColumns.eachKey(function(columnName, column) {
                                var value = lastRecord.get(columnName);
                                var dataValueType = this.getDataValueType(lastRecord, columnName);
                                if (column.orderDirection !== Terrasoft.OrderDirection.NONE) {
                                    if (dataValueType === Terrasoft.DataValueType.LOOKUP) {
                                        value = value ? value.displayValue : null;
                                        dataValueType = Terrasoft.DataValueType.TEXT;
                                    }
                                    conditionalValues.setParameterValue(columnName, value, dataValueType);
                                }
                            }, this);
                        }
                        select.conditionalValues = conditionalValues;
                    }
                },

                prepareActionList: function(filter, list) {
                    var esq = this.Ext.create("Terrasoft.EntitySchemaQuery", {
                        rootSchemaName: "AssistantAction"
                    });
                    esq.addColumn("Id");
                    esq.addColumn("Name");
                    esq.getEntityCollection(function(result) {
                        var collection = result.collection;
                        var obj = {};
                        collection.each(function(item) {
                            obj[item.get("Id")] = {value: item.get("Id"), displayValue: item.get("Name")};
                        });
                        if (!list) {
                            return;
                        }
                        list.clear();
                        list.loadAll(obj);
                    }, this);


                }
            },
            diff: [
                {
                    "operation": "insert",
                    "name": "AssistantMainContainer",
                    "values": {
                        "id": "AssistantMainContainer",
                        "selectors": {"wrapEl": "#AssistantMainContainer"},
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "wrapClass": ["task-main-container"],
                        "items": []
                    }
                },
                {
                    "operation": "insert",
                    "name": "AssistantTabHeader",
                    "propertyName": "items",
                    "parentName": "AssistantMainContainer",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "classes": {"wrapClassName": ["task-header-container"]},
                        "items": []
                    }
                },
                //{
                //    "operation": "insert",
                //    "parentName": "AssistantTabHeader",
                //    "propertyName": "items",
                //    "name": "AssistantButton",
                //    "values": {
                //        "itemType": Terrasoft.ViewItemType.BUTTON,
                //        "caption": "Add Action",
                //        //"caption": {
                //        //    "bindTo": "getMailTypeCaption"
                //        //},
                //        "style": Terrasoft.controls.ButtonEnums.style.TRANSPARENT,
                //        //"classes": {
                //        //    "wrapperClass": ["email-type-button-wrapper", "left-button"],
                //        //    "menuClass": ["email-type-button-menu"]
                //        //},
                //        "menu": {
                //            "items": {"bindTo": "getAssistantMenuItems"}
                //        },
                //        "markerValue": "AssistantButton"
                //    }
                //},
                {
                    "operation": "insert",
                    "name": "AddAction",
                    "propertyName": "items",
                    "parentName": "AssistantTabHeader",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.BUTTON,
                        //"imageConfig": {"bindTo": "Resources.Images.AddActionImage"},
                        "style": Terrasoft.controls.ButtonEnums.style.TRANSPARENT,
                        "caption": "Add",
                        "classes": {
                            wrapperClass: ["add-task-button-wrap"],
                            menuClass: ["task-actions-button-menu"]
                        },
                        "controlConfig": {
                            "menu": {
                                "items": {"bindTo": "AddItemMenuCollection"}
                            }
                        }
                    }
                },
                {
                    "operation": "insert",
                    "name": "ActionTabActions",
                    "propertyName": "items",
                    "parentName": "AssistantTabHeader",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.BUTTON,
                        //"imageConfig": {"bindTo": "Resources.Images.ActionsButtonImage"},
                        "caption": "MENU",
                        "style": Terrasoft.controls.ButtonEnums.style.TRANSPARENT,
                        "classes": {
                            wrapperClass: ["task-actions-button-wrapper", "task-tab-actions-button-wrapper"],
                            menuClass: ["task-actions-button-menu"]
                        },
                        "controlConfig": {
                            "menu": {
                                "items": {"bindTo": "ActionTabActionsMenuCollection"}
                            }
                        },
                        "tips": []
                    }
                },
                {
                    "operation": "insert",
                    "name": "AddDailyContainer",
                    "propertyName": "items",
                    "parentName": "AssistantTabHeader",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "visible": {"bindTo": "IsDailyVisible"},
                        "items": []
                    }
                },
                {
                    "operation": "insert",
                    "name": "ActionCombo",
                    "parentName": "AddDailyContainer",
                    "propertyName": "items",
                    "values": {
                        "dataValueType": Terrasoft.DataValueType.ENUM,
                        "bindTo": "Action",
                        "labelConfig": {
                            "caption": {
                                "bindTo": "Resources.Strings.StyleCaption"
                            }
                        },
                        "controlConfig": {
                            "className": "Terrasoft.ComboBoxEdit",
                            "prepareList": {
                                "bindTo": "prepareActionList"
                            },
                            "list": {
                                "bindTo": "actionList"
                            }
                        }
                    }
                },
                {
                    "operation": "insert",
                    "name": "RunTime",
                    "parentName": "AddDailyContainer",
                    "propertyName": "items",
                    "values": {
                        "bindTo": "runTime",
                        "controlConfig": {
                            "className": "Terrasoft.TimeEdit"
                        }
                    }
                },
                {
                    "operation": "insert",
                    "parentName": "AddDailyContainer",
                    "propertyName": "items",
                    "name": "AddDaily",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.BUTTON,
                        "caption": "Add Action",
                        "style": Terrasoft.controls.ButtonEnums.style.TRANSPARENT,
                        "click": {"bindTo": "addDaily"}
                    }
                },
                 {
                    "operation": "insert",
                    "parentName": "AddDailyContainer",
                    "propertyName": "items",
                    "name": "Cancel",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.BUTTON,
                        "caption": "Cancel",
                        "style": Terrasoft.controls.ButtonEnums.style.TRANSPARENT,
                        "click": {"bindTo": "cancel"}
                    }
                },

                {
                    "operation": "insert",
                    "name": "AddImmediateContainer",
                    "propertyName": "items",
                    "parentName": "AssistantTabHeader",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "visible": {"bindTo": "IsImmediateVisible"},
                        "items": []
                    }
                },
                {
                    "operation": "insert",
                    "name": "IActionCombo",
                    "parentName": "AddImmediateContainer",
                    "propertyName": "items",
                    "values": {
                        "dataValueType": Terrasoft.DataValueType.ENUM,
                        "bindTo": "Action",
                        "labelConfig": {
                            "caption": {
                                "bindTo": "Resources.Strings.StyleCaption"
                            }
                        },
                        "controlConfig": {
                            "className": "Terrasoft.ComboBoxEdit",
                            "prepareList": {
                                "bindTo": "prepareActionList"
                            },
                            "list": {
                                "bindTo": "actionList"
                            }
                        }
                    }
                },
                {
                    "operation": "insert",
                    "parentName": "AddImmediateContainer",
                    "propertyName": "items",
                    "name": "AddImmediate",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.BUTTON,
                        "caption": "Add Action",
                        "style": Terrasoft.controls.ButtonEnums.style.TRANSPARENT,
                        "click": {"bindTo": "addImmediate"}
                    }
                },
                 {
                    "operation": "insert",
                    "parentName": "AddImmediateContainer",
                    "propertyName": "items",
                    "name": "CancelI",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.BUTTON,
                        "caption": "Cancel",
                        "style": Terrasoft.controls.ButtonEnums.style.TRANSPARENT,
                        "click": {"bindTo": "cancel"}
                    }
                },
                //{
                //    "operation": "insert",
                //    "parentName": "EmailTabActions",
                //    "propertyName": "tips",
                //    "name": "EmailTabActionsTooltip",
                //    "values": {
                //        "content": {"bindTo": "TextEmailTabActionsTooltip"},
                //        "visible": {"bindTo": "ShowEmailTabActionsTooltip"},
                //        "linkClicked": {"bindTo": "onEmailTabActionsTooltipClick"},
                //        "items": [],
                //        "behaviour": {
                //            "displayEvent": Terrasoft.TipDisplayEvent.NONE
                //        },
                //        "restrictAlignType": Terrasoft.AlignType.BOTTOM
                //    }
                //},
                {
                    "operation": "insert",
                    "name": "ActionContainerList",
                    "propertyName": "items",
                    "parentName": "AssistantMainContainer",
                    "values": {
                        "itemType": Terrasoft.ViewItemType.CONTAINER,
                        "generator": "ContainerListGenerator.generateGrid",
                        "collection": {"bindTo": "ActionCollection"},
                        "classes": {"wrapClassName": ["task-container-list"]},
                        "onGetItemConfig": {"bindTo": "onGetItemConfig"},
                        "idProperty": "Id",
                        "observableRowNumber": 1,
                        "observableRowVisible": {"bindTo": "onLoadNext"},
                        "rowCssSelector": ".task-container.selectable",
                        "getEmptyMessageConfig": {bindTo: "getEmptyMessageConfig"},
                        "items": []
                    }
                }
            ]
        };
    }
);
