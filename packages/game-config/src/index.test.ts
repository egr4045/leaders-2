import { describe, expect, it } from 'vitest';
import { buildings, combatConfig, influenceConfig, units } from './index.js';

describe('unit balance (4 roles, section 6)', () => {
  it('has the specified strike ranges', () => {
    expect(units.infantry.range).toBe(1);
    expect(units.tank.range).toBe(2);
    expect(units.aircraft.range).toBe(5);
    expect(units.missile.range).toBe(10);
  });

  it('has the specified loot fractions', () => {
    expect(units.infantry.lootFraction).toBe(0.15);
    expect(units.tank.lootFraction).toBe(0.05);
    expect(units.aircraft.lootFraction).toBe(0); // aircraft steal nothing
    expect(units.missile.lootFraction).toBe(0);
  });

  it('marks missiles disposable and aircraft armor-ignoring', () => {
    expect(units.missile.disposable).toBe(true);
    expect(units.aircraft.ignoresArmor).toBe(true);
  });

  it('uses fuel (not ammo) as the only per-distance logistics cost', () => {
    for (const u of Object.values(units)) expect(u.fuelPerHex).toBeGreaterThanOrEqual(0);
  });
});

describe('combat modifiers (section 6.1)', () => {
  it('buildings grant +30% armor and Air Defense intercepts air/missiles', () => {
    expect(combatConfig.garrisonArmorBonus).toBe(0.3);
    expect(combatConfig.airDefenseInterceptChance).toBeGreaterThan(0);
  });
});

describe('flat economy', () => {
  it('extraction buildings produce final resources directly (no chains)', () => {
    expect(buildings.farm.produces.food).toBeGreaterThan(0);
    expect(buildings.mine.produces.materials).toBeGreaterThan(0);
    expect(buildings.fuel_rig.produces.fuel).toBeGreaterThan(0); // no oil->fuel chain
    expect(buildings.market.produces.money).toBeGreaterThan(0);
  });

  it('marks the exchange unique', () => {
    expect(buildings.exchange.unique).toBe(true);
  });
});

describe('influence (victory currency)', () => {
  it('vote-buying is expensive and tech race has three tiers', () => {
    expect(influenceConfig.moneyPerVote).toBeGreaterThanOrEqual(100);
    expect(influenceConfig.techRaceBounty).toHaveLength(3);
  });

  it("a vassal feeds part of its influence to its overlord", () => {
    expect(influenceConfig.vassalInfluenceShare).toBeGreaterThan(0);
    expect(influenceConfig.vassalInfluenceShare).toBeLessThanOrEqual(1);
  });
});
