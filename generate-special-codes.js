// Generate 80 special one-time 12-month access codes
// These codes can only be used once per code (not per device like regular codes)

function generateSpecialCode(index) {
    // Format: LARK + 4 digits (e.g., LARK0001, LARK0002, etc.)
    const paddedIndex = index.toString().padStart(4, '0');
    return `LARK${paddedIndex}`;
}

function generateAllSpecialCodes() {
    const codes = [];
    const currentYear = new Date().getFullYear();
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 12 months from now

    for (let i = 1; i <= 80; i++) {
        const code = generateSpecialCode(i);
        codes.push({
            code: code,
            type: 'special_12month',
            maxActivations: 1, // One-time use per code
            usedActivations: 0,
            createdAt: new Date().toISOString(),
            expiresAt: expirationDate.toISOString(),
            valid: true,
            notes: `Special 12-month access code - one-time use`
        });
    }

    return codes;
}

// Generate codes
const specialCodes = generateAllSpecialCodes();

// Output for JSON file
console.log('Generated 80 special access codes:\n');
console.log(JSON.stringify(specialCodes, null, 2));

// Output simple list for distribution
console.log('\n\n=== SIMPLE CODE LIST ===\n');
specialCodes.forEach((item, index) => {
    console.log(`${index + 1}. ${item.code}`);
});

// Output formatted for easy copy-paste
console.log('\n\n=== FORMATTED FOR DISTRIBUTION ===\n');
console.log('Code Compass - Special 12-Month Access Codes');
console.log('Each code provides full premium access for 12 months');
console.log('Each code can only be used once (on one device)\n');
console.log('CODES:');
specialCodes.forEach((item, index) => {
    if (index % 10 === 0 && index > 0) console.log(''); // Add blank line every 10 codes
    console.log(`${item.code}`);
});
