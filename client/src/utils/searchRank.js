/**
 * Calculate search match relevance score for a member.
 * Lower score = higher priority / displayed first.
 * Priority:
 * 1. First name match (score ~10-14)
 * 2. Second / Middle name match (score ~20-24)
 * 3. Last name match (score ~30-34)
 * 4. Other matches like uniqueCode or mobileNumber (score ~45-62)
 */
export function getSearchMatchRank(member, searchStr) {
  if (!searchStr) return 0;
  const q = searchStr.trim().toLowerCase();
  if (!q) return 0;

  let bestScore = 999;

  const checkNameString = (str) => {
    if (!str) return;
    const clean = str.trim().toLowerCase();
    if (!clean) return;

    if (clean === q) {
      bestScore = Math.min(bestScore, 5);
      return;
    }

    if (clean.startsWith(q)) {
      bestScore = Math.min(bestScore, 10);
    }

    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    // First Name
    const firstName = words[0];
    if (firstName === q) {
      bestScore = Math.min(bestScore, 10);
    } else if (firstName.startsWith(q)) {
      bestScore = Math.min(bestScore, 12);
    } else if (firstName.includes(q)) {
      bestScore = Math.min(bestScore, 14);
    }

    // Middle / Second Names (if 3 or more words)
    if (words.length >= 3) {
      const middleNames = words.slice(1, words.length - 1);
      for (const mid of middleNames) {
        if (mid === q) {
          bestScore = Math.min(bestScore, 20);
        } else if (mid.startsWith(q)) {
          bestScore = Math.min(bestScore, 22);
        } else if (mid.includes(q)) {
          bestScore = Math.min(bestScore, 24);
        }
      }
    }

    // Last Name (if 2 or more words)
    if (words.length >= 2) {
      const lastName = words[words.length - 1];
      if (lastName === q) {
        bestScore = Math.min(bestScore, 30);
      } else if (lastName.startsWith(q)) {
        bestScore = Math.min(bestScore, 32);
      } else if (lastName.includes(q)) {
        bestScore = Math.min(bestScore, 34);
      }
    }

    // Full name contains
    if (clean.includes(q)) {
      bestScore = Math.min(bestScore, 40);
    }
  };

  if (member) {
    checkNameString(member.name);
    checkNameString(member.nameEn);

    if (member.uniqueCode) {
      const code = member.uniqueCode.trim().toLowerCase();
      if (code === q) {
        bestScore = Math.min(bestScore, 45);
      } else if (code.startsWith(q)) {
        bestScore = Math.min(bestScore, 48);
      } else if (code.includes(q)) {
        bestScore = Math.min(bestScore, 50);
      }
    }

    if (member.mobileNumber) {
      const mob = member.mobileNumber.toString().trim();
      if (mob.startsWith(q)) {
        bestScore = Math.min(bestScore, 60);
      } else if (mob.includes(q)) {
        bestScore = Math.min(bestScore, 62);
      }
    }
  }

  return bestScore;
}

export function sortMembersBySearchRank(members, searchStr) {
  if (!Array.isArray(members)) return [];
  if (!searchStr || !searchStr.trim()) {
    return [...members].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'gu'));
  }
  const cleanSearch = searchStr.trim();
  return [...members].sort((a, b) => {
    const scoreA = getSearchMatchRank(a, cleanSearch);
    const scoreB = getSearchMatchRank(b, cleanSearch);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }
    return (a.name || '').localeCompare(b.name || '', 'gu');
  });
}
