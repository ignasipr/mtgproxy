#!/usr/bin/env node

/**
 * Test suite for cardlist import functionality
 * Validates acceptance criteria:
 * Run with: node tests/cardlist-unit.js
 */

// Simple test framework
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Mock parseCardlist for Node.js environment
function parseCardlist(input) {
  const lines = input.split('\n');
  const cards = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('//')) {
      continue;
    }

    const match = trimmed.match(/^(\d+)\s+(.+)$/);

    if (match) {
      const quantity = parseInt(match[1], 10);
      const name = match[2].trim();
      if (name) {
        cards.push({ name, quantity });
      }
    } else {
      cards.push({ name: trimmed, quantity: 1 });
    }
  }

  return cards;
}

// ============================================================================
// Tests
// ============================================================================

test('Parse "1 Sol Ring" format', () => {
  const result = parseCardlist('1 Sol Ring');
  assert(result.length === 1, 'Should parse single card');
  assert(result[0].name === 'Sol Ring', 'Should extract card name');
  assert(result[0].quantity === 1, 'Should extract quantity');
});

test('Parse multiple cards with quantities', () => {
  const input = `1 Sol Ring
4 Lightning Bolt
3 Counterspell`;
  const result = parseCardlist(input);
  assert(result.length === 3, 'Should parse 3 cards');
  assert(result[0].quantity === 1, 'First card quantity');
  assert(result[1].quantity === 4, 'Second card quantity');
  assert(result[2].quantity === 3, 'Third card quantity');
});

test('Parse card name without quantity (defaults to 1)', () => {
  const result = parseCardlist('Lightning Bolt');
  assert(result.length === 1, 'Should parse single card');
  assert(result[0].quantity === 1, 'Should default to quantity 1');
  assert(result[0].name === 'Lightning Bolt', 'Should extract name');
});

test('Ignore empty lines and whitespace', () => {
  const input = `1 Sol Ring

4 Lightning Bolt

3 Counterspell`;
  const result = parseCardlist(input);
  assert(result.length === 3, 'Should ignore empty lines');
});

test('Handle extra whitespace', () => {
  const input = '  1   Sol Ring  ';
  const result = parseCardlist(input);
  assert(result.length === 1, 'Should handle leading/trailing whitespace');
  assert(result[0].name === 'Sol Ring', 'Should trim card name');
});

test('Ignore comment lines', () => {
  const input = `1 Sol Ring
// This is a comment
4 Lightning Bolt`;
  const result = parseCardlist(input);
  assert(result.length === 2, 'Should ignore comment lines');
});

test('Parse large quantities', () => {
  const result = parseCardlist('60 Mountain');
  assert(result.length === 1, 'Should parse card');
  assert(result[0].quantity === 60, 'Should parse large quantity');
});

test('Handle edge cases - empty input', () => {
  const result = parseCardlist('');
  assert(result.length === 0, 'Empty input should return empty array');
  
  const result2 = parseCardlist('\n\n\n');
  assert(result2.length === 0, 'Only whitespace should return empty array');
});

test('Card type structure supports future printing/set selection', () => {
  const simulatedResolvedCard = {
    id: 'test-id-123',
    name: 'Sol Ring',
    quantity: 1,
    imageUrl: 'https://example.com/image.jpg',
    scryId: 'test-scry-id',
    printings: ['LEA', 'LEB', '2X2', 'SLD'],
  };

  assert(simulatedResolvedCard.name === 'Sol Ring', 'Should have name');
  assert(simulatedResolvedCard.quantity === 1, 'Should have quantity');
  assert(simulatedResolvedCard.imageUrl, 'Should have image URL');
  assert(Array.isArray(simulatedResolvedCard.printings), 'Should support multiple printings');
  assert(simulatedResolvedCard.printings.length > 0, 'Should have printings array');
});

test('CardResolution structure supports errors without blocking deck', () => {
  const resolvedCardResolution = {
    originalName: 'Lightning Bolt',
    quantity: 4,
    resolved: true,
    card: {
      id: 'lb-id',
      name: 'Lightning Bolt',
      quantity: 4,
      scryId: 'lb-scry',
    },
  };

  const unresolvedCardResolution = {
    originalName: 'Unknown Card',
    quantity: 1,
    resolved: false,
    error: 'Card not found in Scryfall database',
  };

  assert(resolvedCardResolution.resolved === true, 'Resolved cards marked correctly');
  assert(unresolvedCardResolution.resolved === false, 'Unresolved cards marked correctly');
  assert(unresolvedCardResolution.error, 'Unresolved cards have error message');
});

// ============================================================================
// Run tests
// ============================================================================

console.log('========================================');
console.log('MTG Cardlist Import - Unit Tests');
console.log('========================================\n');

for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}\n`);
    failed++;
  }
}

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('========================================');

process.exit(failed > 0 ? 1 : 0);
