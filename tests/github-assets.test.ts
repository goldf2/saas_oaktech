import test from 'node:test';
import assert from 'node:assert/strict';
import { githubArtifactName } from '../lib/store/github-assets.ts';
import { releaseErrorMessages } from '../lib/store/release-errors.ts';
test('Open Play imports website-signed feeds with canonical names and excludes GitHub feeds', () => {
  assert.equal(githubArtifactName('open-play','appcast-website.xml'),'appcast.xml');
  assert.equal(githubArtifactName('open-play','windows-website.json'),'windows.json');
  assert.equal(githubArtifactName('open-play','appcast.xml'),null);
  assert.equal(githubArtifactName('open-play','windows.json'),null);
  assert.equal(githubArtifactName('open-play','open-play-0.6.6.13-macos.zip'),'open-play-0.6.6.13-macos.zip');
});
test('other software keeps original asset names', () => {
  assert.equal(githubArtifactName('other','appcast.xml'),'appcast.xml');
  assert.equal(githubArtifactName('other','appcast-website.xml'),'appcast-website.xml');
});
test('website metadata mismatch reports the correct replacement without weakening signatures', () => {
  assert.match(releaseErrorMessages.OPEN_PLAY_MAC_METADATA_MISMATCH,/appcast-website.xml/);
  assert.match(releaseErrorMessages.OPEN_PLAY_WINDOWS_METADATA_MISMATCH,/windows-website.json/);
  assert.match(releaseErrorMessages.OPEN_PLAY_SIGNATURE_INVALID,/签名无效/);
});
