/* eslint-env jquery */
import VSS from 'vss-sdk';
const Controls = VSS.Controls;

class BuildDumpSection extends Controls.BaseControl {
  constructor() {
  }
  initialize() {
    super.initialize();
    // Get configuration that's shared between extension and the extension host
    var sharedConfig = VSS.getConfiguration();
    if (sharedConfig) {
      // register your extension with host through callback
      sharedConfig.onBuildChanged((build) => { this._initBuildDump(build); });
    }
  }

  _initBuildDump(build) {
    var span = $('<span />');
    span.text(JSON.stringify(build));
    this._element.append(span);
  }
}

export default BuildDumpSection;
