'use strict';

const TrophyProgress = (() => {
  const progressKey = 'leonida-ledger.progress.v1';
  const legacyKey = 'gta6-trophy-checklist';
  const spoilerKey = 'leonida-ledger.spoilers';
  const demoIds = [2, 3, 4, 8, 9, 10, 16, 18, 19, 20, 21, 22, 26, 28, 30, 35, 42, 44, 46, 55];

  function readRecord(record, trophies) {
    const legacy = Array.isArray(record);
    const list = legacy ? record : record?.earned;
    if ((!legacy && (record?.version !== 1 || record?.game !== 'GTA VI')) || !Array.isArray(list)) {
      throw new Error('Choose a Leonida Ledger progress export.');
    }
    const ids = new Set(trophies.map(trophy => trophy.id));
    const names = new Map(trophies.map(trophy => [trophy.name, trophy.id]));
    const earned = new Set();
    for (const entry of list) {
      const id = legacy && typeof entry === 'string' ? names.get(entry) : entry;
      if (!ids.has(id)) throw new Error('The file contains an unknown trophy.');
      earned.add(id);
    }
    return earned;
  }

  function load(trophies, demo) {
    if (demo) return new Set(demoIds);
    try {
      const saved = localStorage.getItem(progressKey) ?? localStorage.getItem(legacyKey);
      return saved ? readRecord(JSON.parse(saved), trophies) : new Set();
    } catch {
      return new Set();
    }
  }

  function serialize(earned) {
    return JSON.stringify({ game: 'GTA VI', version: 1, earned: [...earned].sort((a, b) => a - b) }, null, 2);
  }

  function save(earned) {
    try {
      localStorage.setItem(progressKey, serialize(earned));
      return true;
    } catch {
      return false;
    }
  }

  function readSpoilers() {
    try {
      return localStorage.getItem(spoilerKey) === 'on';
    } catch {
      return false;
    }
  }

  function saveSpoilers(hidden) {
    try {
      localStorage.setItem(spoilerKey, hidden ? 'on' : 'off');
    } catch {
      // The switch still applies in this page if storage is unavailable.
    }
  }

  return { readRecord, load, serialize, save, readSpoilers, saveSpoilers };
})();
