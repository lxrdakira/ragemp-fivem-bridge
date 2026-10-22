const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('../node_modules/typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/safeZoneDamageGate.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledExports = {};
vm.runInNewContext(compiled, { exports: compiledExports, Set, Number });
const { shouldCancelSafeZoneWeaponDamage } = compiledExports;

const makeResolver = (safeSources = [], entities = {}) => ({
    playerBySource: (source) => safeSources.includes(source)
        ? { getVariable: (key) => key === 'SZ' }
        : { getVariable: () => false },
    entityFromNetId: (id) => entities[id]?.handle || 0,
    entityOwner: (handle) => Object.values(entities).find((entity) => entity.handle === handle)?.owner || 0,
    playerPed: (source) => Object.values(entities).find((entity) => entity.owner === source && entity.playerPed)?.handle || 0,
});

test('green-zone attacker cannot send firearm damage to a remote player', () => {
    assert.equal(shouldCancelSafeZoneWeaponDamage(1, { weaponType: 123, hitGlobalId: 10 },
        makeResolver([1], { 10: { handle: 100, owner: 2, playerPed: true } })), true);
});

test('firearm damage to a protected player is canceled even if attacker is outside', () => {
    assert.equal(shouldCancelSafeZoneWeaponDamage(1, { weaponType: 123, hitGlobalId: 10 },
        makeResolver([2], { 10: { handle: 100, owner: 2, playerPed: true } })), true);
});

test('stun gun exception applies to attacker only, not to a protected victim', () => {
    const entities = { 10: { handle: 100, owner: 2, playerPed: true } };
    assert.equal(shouldCancelSafeZoneWeaponDamage(1, { weaponType: 911657153, hitGlobalId: 10 },
        makeResolver([1], entities)), false);
    assert.equal(shouldCancelSafeZoneWeaponDamage(1, { weaponType: 911657153, hitGlobalId: 10 },
        makeResolver([2], entities)), true);
});

test('player-owned NPCs and vehicles do not inherit owner safe-zone state', () => {
    assert.equal(shouldCancelSafeZoneWeaponDamage(1, { weaponType: 123, hitGlobalId: 10 },
        makeResolver([2], { 10: { handle: 100, owner: 2, playerPed: false } })), false);
});

test('all hitGlobalIds are considered, without treating malformed ids as players', () => {
    const entities = {
        10: { handle: 100, owner: 3, playerPed: true },
        20: { handle: 200, owner: 2, playerPed: true },
    };
    assert.equal(shouldCancelSafeZoneWeaponDamage(1, {
        weaponType: 123, hitGlobalId: 10, hitGlobalIds: [NaN, -1, 20],
    }, makeResolver([2], entities)), true);
    assert.equal(shouldCancelSafeZoneWeaponDamage(1, {
        weaponType: 123, hitGlobalId: 20, hitGlobalIds: 'invalid',
    }, makeResolver([2], entities)), true);
});
