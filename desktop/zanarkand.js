const { ZanarkandFFXIV } = require('node-zanarkand-ffxiv');
const isDev = require('electron-is-dev');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');

const zanarkandExePath = path.join(app.getAppPath(), '../../resources/ZanarkandWrapperJSON/ZanarkandWrapperJSON.exe');

let Zanarkand;

function sendToRenderer(win, packet) {
  win && win.webContents && win.webContents.send('packet', packet);
}

function filterPacketSessionID(packet) {
  const packetsFromOthers = [
    'playerSpawn',
    'actorControl',
    'updateClassInfo',
    'actorControlSelf',
    'effectResult',
    'eventPlay',
    'eventStart',
    'eventFinish',
    'eventPlay4',
    'someDirectorUnk4'
  ];
  return packetsFromOthers.indexOf(packet.type) === -1
    || packet.sourceActorSessionID === packet.targetActorSessionID;
}

module.exports.start = function(win, config, verbose) {
  const region = config.get('region', null);
  const options = isDev ?
    {
      region: region
    } : {
      noData: true,
      region: region,
      zanarkandExePath: zanarkandExePath,
      remoteDataPath: path.join(app.getAppPath(), '../../resources/remote-data'),
    };

  if (verbose) {
    options.logger = log.log;
  }

  const acceptedPackets = [
    'itemInfo',
    'updateInventorySlot',
    'inventoryTransaction',
    'currencyCrystalInfo',
    'marketBoardItemListingCount',
    'marketBoardItemListing',
    'marketBoardItemListingHistory',
    'marketBoardSearchResult',
    'marketTaxRates',
    'playerSetup',
    'playerSpawn',
    'inventoryModifyHandler',
    'npcSpawn',
    'objectSpawn',
    'playerStats',
    'updateClassInfo',
    'actorControl',
    'initZone',
    'effectResult',
    'eventPlay',
    'eventStart',
    'eventFinish',
    'eventPlay4',
    'someDirectorUnk4',
    'actorControlSelf',
    'retainerInformation',
    'weatherChange',
    'updatePositionHandler',
    'updatePositionInstance',
    'prepareZoning'
  ];

  Zanarkand = new ZanarkandFFXIV(options);
  Zanarkand.filter(acceptedPackets);
  Zanarkand.start(() => {
    log.info('Packet capture started');
  });
  Zanarkand.setMaxListeners(0);
  Zanarkand.on('any', (packet) => {
    if (verbose) {
      log.log(JSON.stringify(packet));
    }
    if (!filterPacketSessionID(packet)) {
      return;
    }
    if (acceptedPackets.indexOf(packet.type) > -1 || acceptedPackets.indexOf(packet.superType) > -1) {
      sendToRenderer(win, packet);
    }
  });
};

module.exports.stop = function() {
  if (Zanarkand) {
    Zanarkand.stop();
  }
};
