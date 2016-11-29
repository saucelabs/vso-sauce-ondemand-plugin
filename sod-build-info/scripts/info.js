/* eslint-env jquery, browser, es6 */
/* global VSS */
require('babel-polyfill');
const TaskAgentRestClient = require('TFS/DistributedTask/TaskAgentRestClient');
const TaskRestClient = require('TFS/DistributedTask/TaskRestClient');
//require('text-encoding');

const webContext = VSS.getWebContext();
const taskAgentRestClient = TaskAgentRestClient.getClient();
const taskRestClient = TaskRestClient.getClient();
const sharedConfig = VSS.getConfiguration();

sharedConfig.onBuildChanged(async function(build) {
  try {
    const taskAttachments = await taskRestClient.getPlanAttachments(
      webContext.project.id,
      'build',
      build.orchestrationPlan.planId,
      'SauceLabsBuildResult'
    );
    const buildInformation = await taskRestClient.getAttachmentContent(
      webContext.project.id,
      'build',
      build.orchestrationPlan.planId,
      taskAttachments[0].timelineId,
      taskAttachments[0].recordId,
      taskAttachments[0].type,
      taskAttachments[0].name
    )
      .then(arrayBuffer => new window.TextDecoder('UTF-8').decode(arrayBuffer))
      .then(str => JSON.parse(str));

    const body = {
      'dataSourceDetails': {
        dataSourceName: 'getBuildFullJobs',
        parameters: {
          build: buildInformation.SAUCE_BUILD_NAME,
          username: buildInformation.SAUCE_USERNAME
        }
      }
    };
    console.log('taskAgentRestClient.executeServiceEndpointRequest', body);
    const jobs = await taskAgentRestClient.executeServiceEndpointRequest(
      body,
      webContext.project.id,
      buildInformation.CONNECTED_SERVICE_NAME
    )
      .then(results => results.result[0])
      .then(str => JSON.parse(str));

    console.log('jobs', jobs);
    const $table = $('<table>');
    $table.css('min-width', '800px');
    $table.append('<thead><tr><th align="left">Job Name</th><th align="left">OS/Browser</th><th align="left">Pass/Fail</th><th align="left">Job Links</th></tr></thead>');
    jobs.jobs.forEach(job => {
      const $tr = $('<tr>');
      $tr.append($('<td>').append(
        $('<a>').attr('href', '#').text(job.name)
      ));
      $tr.append($('<td>').text(job.os + ' ' + job.browser));
      $tr.append($('<td>').text(job.status));
      $tr.append(
        $('<td>')
          .append($('<a>').attr('href', '#').text('Video'))
          .append(' - ')
          .append($('<a>').attr('href', '#').text('Logs'))
      );
      $table.append($tr);
    });
    $('.build-info').empty().append('<h2>Sauce Labs results</h2>').append($table);
  } catch (err) {
    console.error('error', err);
  }
});
/*

const VSS_Auth_Service = require('VSS/Authentication/Services');
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
