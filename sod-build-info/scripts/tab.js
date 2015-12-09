/* eslint-env jquery */
import VSS from 'vss-sdk';
const Controls = VSS.Controls;

class InfoTab extends Controls.BaseControl {
  constructor() {
  }
  initialize() {
    super.initialize();
    // Get configuration that's shared between extension and the extension host
    var sharedConfig = VSS.getConfiguration();
    var vsoContext = VSS.getWebContext();
    console.log(vsoContext.project.id);

    if (sharedConfig) {
      // register your extension with host through callback
      sharedConfig.onBuildChanged((build) => { this._initBuildDump(build); });
    }
  }

  _initBuildDump(build) {
    console.log('build', build);
  }
}

export default InfoTab;
InfoTab.enhance(InfoTab, $('.build-info'), {});
// Notify the parent frame that the host has been loaded
VSS.notifyLoadSucceeded();
