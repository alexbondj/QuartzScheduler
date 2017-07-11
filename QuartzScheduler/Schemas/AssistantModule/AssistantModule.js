define("AssistantModule", ["BaseSchemaModuleV2"], function() {
    /**
     * @class Terrasoft.configuration.CtiPanelModule
     * CTI panel page class to work with calls.
     */
    Ext.define("Terrasoft.configuration.AssistantModule", {
        alternateClassName: "Terrasoft.AssistantModule",
        extend: "Terrasoft.BaseSchemaModule",

        /**
         * Initializes the name of the scheme.
         * @protected
         * @overridden
         */
        initSchemaName: function() {
            this.schemaName = "AssistantSchema";
        },

        /**
         * Replaces the last element in the chain of states, if the identifier module is different from the current.
         * @protected
         * @overridden
         */
        initHistoryState: Ext.emptyFn


    });
    return Terrasoft.AssistantModule;
});
