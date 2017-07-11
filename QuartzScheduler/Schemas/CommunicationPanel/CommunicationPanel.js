define("CommunicationPanel", ["terrasoft"],
    function(Terrasoft) {
        return {
            messages: {},
            attributes: {},
            methods: {

            },
            diff: [
                {
                    "operation": "insert",
                    "parentName": "communicationPanelContent",
                    "propertyName": "items",
                    "name": "Assistant",
                    "values": {
                        "tag": "Assistant",
                        "generator": "CommunicationPanelHelper.generateMenuItem"
                    }
                }
            ]
        };
    });
