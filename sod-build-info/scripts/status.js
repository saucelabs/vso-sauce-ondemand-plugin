/* eslint-env jquery */
/* global VSS */
const Controls = require('VSS/Controls');
const VSS_Service = require('VSS/Service');
const TFS_Build_Contracts = require('TFS/Build/Contracts');
const TFS_Build_Extension_Contracts = require('TFS/Build/ExtensionContracts');

class StatusSection extends Controls.BaseControl {
  constructor() {
    super();
  }
  initialize() {
    super.initialize();
    // Get configuration that's shared between extension and the extension host
    var sharedConfig = VSS.getConfiguration();
    var vsoContext = VSS.getWebContext();
    console.log('status', vsoContext.project);

    if (sharedConfig) {
      // register your extension with host through callback
      sharedConfig.onBuildChanged((build) => {
        var buildId = build.id;
       /* var imgSource = "images/none.jpg";
        this._element.find("#status-img").attr("src", imgSource);*/
        console.log('onBuildChanged', buildId);
        this._initBuildStatus(build);
      });
    }
  }

  _initBuildStatus(build) {
    let status = 'unknown';
    if(build.status === TFS_Build_Contracts.BuildStatus.InProgress) {
      status = 'running';
    }
    else if(build.status === TFS_Build_Contracts.BuildStatus.Completed) {
      if(build.result === TFS_Build_Contracts.BuildResult.Succeeded) {
        status = 'success';
      }
      else if(build.result === TFS_Build_Contracts.BuildResult.Failed) {
        status = 'failed';
      }
    }
    this._element.text('Pretend - ' + status);
  }
}

export default StatusSection;
StatusSection.enhance(StatusSection, $('.build-status'), {});

// Notify the parent frame that the host has been loaded
VSS.notifyLoadSucceeded();
