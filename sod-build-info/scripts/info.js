/* eslint-env jquery, browser */
/* global VSS */
require('text-encoding');
const VSS_Auth_Service = require('VSS/Authentication/Services');
const BuildRestClient = require('TFS/Build/RestClient');
const TaskAgentRestClient = require('TFS/DistributedTask/TaskAgentRestClient');
const TaskRestClient = require('TFS/DistributedTask/TaskRestClient');

const webContext = VSS.getWebContext();
const taskAgentRestClient = TaskAgentRestClient.getClient();
const taskRestClient = TaskRestClient.getClient();
const buildClient = BuildRestClient.getClient();
const sharedConfig = VSS.getConfiguration();

sharedConfig.onBuildChanged(function(build) {

  taskRestClient.getPlanAttachments(webContext.project.id, 'build', build.orchestrationPlan.planId, 'SauceLabsBuildResult')
    .then(taskAttachments => {
      var sauceLabsResults = taskAttachments[0]; // should only ever be one
      return taskRestClient.getAttachmentContent(
        webContext.project.id,
        'build',
        build.orchestrationPlan.planId,
        sauceLabsResults.timelineId,
        sauceLabsResults.recordId,
        sauceLabsResults.type,
        sauceLabsResults.name
      ).then(arrayBuffer => new window.TextDecoder('UTF-8').decode(arrayBuffer));
    })
    .then(result => console.log('getAttachment', result));

  buildClient.getDefinition(
    build.definition.id,
    webContext.project.id
  ).then(function(definition) {
    // build2.variables object should be able to override the generated build name
    var tasks = definition.build.filter(function(buildInfo) {
      // is there a better way to identify sod-main?
      return 'sauceConnect' in buildInfo.inputs;
    });
    // Find LD service endpoint (which defines which resources we can query)
    taskAgentRestClient.getServiceEndpointDetails(
      webContext.project.id,
      tasks[0].inputs.connectedServiceName
    ).then(function(endpoint) {
      console.log('endpoints', endpoint);
      var body = {
        'dataSourceDetails': {
          'dataSourceName': 'getBuild'
        }
      };
      console.log('body', body);
      taskAgentRestClient.executeServiceEndpointRequest(
        body,
        webContext.project.id,
        endpoint.id
      )
        .then(blah => console.log('executeServiceEndpointRequest', blah))
        .catch(blah => console.error('err:executeServiceEndpointRequest', blah));
      return;
      // Call LD via the service endpoint (auth header is automatically set)
      taskAgentRestClient.queryServiceEndpoint(
        {
          dataSourceName: 'getBuild',
          endpointId: endpoint.id,
          parameters: {
            username: 'halkeye'
          }
        },
        webContext.project.id
      ).then(
        function(res) { console.log('queryres', res); },
        function(error) { console.error('queryerr', error); }
      );
    });
  });
});

VSS.getAccessToken().then(function(token){
  // Format the auth header
  var authHeader = VSS_Auth_Service.authTokenManager.getAuthorizationHeader(token);

  // Add token as an Authorization header to your request
  console.log('authHeader', authHeader);
});

VSS.getAppToken().then(token => {
  console.log('User token is', token);
});


