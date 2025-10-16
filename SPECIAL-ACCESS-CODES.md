# Code Compass - Special 12-Month Access Codes

## Overview
80 special one-time use codes have been generated for Code Compass premium access.

### Code Details:
- **Format:** LARK0001 through LARK0080
- **Duration:** 12 months from activation date
- **Usage:** Each code can be used ONCE on ONE device only
- **Expiration Behavior:** After 12 months, the app automatically reverts to freemium version
- **No Renewal:** These codes do not auto-renew

---

## Complete List of Access Codes

### Codes 1-10
1. LARK0001
2. LARK0002
3. LARK0003
4. LARK0004
5. LARK0005
6. LARK0006
7. LARK0007
8. LARK0008
9. LARK0009
10. LARK0010

### Codes 11-20
11. LARK0011
12. LARK0012
13. LARK0013
14. LARK0014
15. LARK0015
16. LARK0016
17. LARK0017
18. LARK0018
19. LARK0019
20. LARK0020

### Codes 21-30
21. LARK0021
22. LARK0022
23. LARK0023
24. LARK0024
25. LARK0025
26. LARK0026
27. LARK0027
28. LARK0028
29. LARK0029
30. LARK0030

### Codes 31-40
31. LARK0031
32. LARK0032
33. LARK0033
34. LARK0034
35. LARK0035
36. LARK0036
37. LARK0037
38. LARK0038
39. LARK0039
40. LARK0040

### Codes 41-50
41. LARK0041
42. LARK0042
43. LARK0043
44. LARK0044
45. LARK0045
46. LARK0046
47. LARK0047
48. LARK0048
49. LARK0049
50. LARK0050

### Codes 51-60
51. LARK0051
52. LARK0052
53. LARK0053
54. LARK0054
55. LARK0055
56. LARK0056
57. LARK0057
58. LARK0058
59. LARK0059
60. LARK0060

### Codes 61-70
61. LARK0061
62. LARK0062
63. LARK0063
64. LARK0064
65. LARK0065
66. LARK0066
67. LARK0067
68. LARK0068
69. LARK0069
70. LARK0070

### Codes 71-80
71. LARK0071
72. LARK0072
73. LARK0073
74. LARK0074
75. LARK0075
76. LARK0076
77. LARK0077
78. LARK0078
79. LARK0079
80. LARK0080

---

## How to Use

### For Users:
1. Visit: https://codecompassapp.netlify.app/
2. Click on the activation/unlock button
3. Enter your 8-character code (e.g., LARK0001)
4. Click "Activate Premium Features"
5. Full premium access will be granted for 12 months

### Important Notes:
- Each code works only ONCE
- After 12 months, premium features will be disabled
- The app will revert to freemium (free) version automatically
- No subscription management needed
- No credit card required

---

## Technical Implementation

### Files Modified:
1. **Backend:** `netlify/functions/activation-manager.js`
   - Added LARK code validation (regex: `/^LARK\d{4}$/`)
   - Validates code number is between 1-80
   - Returns 12-month expiration date
   - Marks code as special_12month type

2. **Frontend:** `src/components/ActivationModal.jsx`
   - Added offline validation for LARK codes
   - Displays special success message
   - Stores specialCode flag in localStorage
   - Sets 12-month expiration tracking

### Code Format:
- Pattern: `LARK` + 4 digits
- Example: LARK0001, LARK0042, LARK0080
- Case-insensitive (LARK0001 = lark0001)

### Storage:
When activated, the following data is stored in localStorage:
```javascript
{
  isActive: true,
  activatedAt: "2025-10-16T...",
  expiresAt: "2026-10-16T...",
  activationCode: "LARK0001",
  deviceId: "device_xxx",
  remainingActivations: 0,
  isSpecialActivation: true,
  specialCode: true
}
```

---

## Distribution Recommendations

### Use Cases:
- Trade shows and exhibitions
- Educational institutions (1 code per student)
- Corporate training programs
- Marketing campaigns
- Gift codes for customers
- Partner/affiliate programs

### Tracking Usage:
Monitor code usage by checking activation logs in Netlify Functions.
Each activation logs the code number and timestamp.

---

## Support

For issues with codes or activation:
- Check: https://codecompassapp.netlify.app/
- Verify code is typed correctly (8 characters)
- Ensure code hasn't been used previously
- Try online activation first (offline fallback available)

---

**Generated:** October 16, 2025
**Total Codes:** 80
**Validity:** 12 months from activation
**Website:** https://codecompassapp.netlify.app/
