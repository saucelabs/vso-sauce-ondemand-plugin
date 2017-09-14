node('docker') {
  stage 'Checkout'
  checkout scm

  stage 'Build'
  withEnv(["HOME=${env.WORKSPACE}"]) {
      docker.image('node:6.6.0').inside {
          sh 'export'
          sh 'mkdir ~/.npm-global'
          sh 'npm config get prefix ~/.npm-global'
          sh 'npm install'
          sh 'npm run package'
      }
  }

  stage 'Archive Results'
  step([$class: 'ArtifactArchiver', artifacts: 'Packages/*.vsix'])
}

