/* eslint-env jquery, browser */
/* global VSS */
const VSS_Auth_Service = require('VSS/Authentication/Services');
const BuildRestClient = require('TFS/Build/RestClient');
const TaskAgentRestClient = require('TFS/DistributedTask/TaskAgentRestClient');

const webContext = VSS.getWebContext();
const taskAgentRestClient = TaskAgentRestClient.getClient();
const buildClient = BuildRestClient.getClient();
const sharedConfig = VSS.getConfiguration();

sharedConfig.onBuildChanged(function(build) {
  /*

  const TaskRestClient = require('TFS/DistributedTask/TaskRestClient');
  const taskRestClient = TaskRestClient.getClient();
  require('text-encoding');
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
  */

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
    return taskAgentRestClient.getServiceEndpointDetails(
      webContext.project.id,
      tasks[0].inputs.connectedServiceName
    ).then(function(endpoint) {
      console.log('endpoint', endpoint);
      var body = {
        'dataSourceDetails': {
          dataSourceName: 'getBuildFullJobs',
          parameters: {
            build: 'JavaSauceExample_Build25',
            username: endpoint.authorization.parameters.username
          }
        }
      };
      console.log('body', body);
      console.log('taskAgentRestClient.executeServiceEndpointRequest', body);
      return taskAgentRestClient.executeServiceEndpointRequest(
        body,
        webContext.project.id,
        endpoint.id
      )
        .then(results => results.result[0])
        .then(str => JSON.parse(str))
        .then(jobs => {
          console.log('jobs', jobs);
          const $ul = $('<ul>');
          jobs.jobs.forEach(job => {
            const $li = $('<li>');
            $li.text(`${job.name} - ${job.os} - ${job.browser} - ${job.name} - ${job.status}`);
            $ul.append($li);
          });
          $('.build-info').empty().append($ul);
        });
    });
  }).catch(blah => console.error('endpoint', blah));
});
/*

VSS.getAccessToken().then(function(token){
  // Format the auth header
  var authHeader = VSS_Auth_Service.authTokenManager.getAuthorizationHeader(token);

  // Add token as an Authorization header to your request
  console.log('authHeader', authHeader);
});

VSS.getAppToken().then(token => {
  console.log('User token is', token);
});

*/
