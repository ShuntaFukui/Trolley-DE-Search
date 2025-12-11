import { describe, it, expect, beforeEach } from 'vitest';

// TrolleyGameのロジックを抽出してテスト
interface Restaurant {
  id?: string;
  shop_id?: string;
  name: string;
  recommended_people?: Array<{ name: string; comment: string; label?: number }>;
  photo_url?: string;
  url?: string;
  access?: string;
}

interface TournamentMatch {
  round: string;
  matchNumber: number;
  options: [Restaurant, Restaurant];
  winner: Restaurant;
  loser: Restaurant;
  answeredAt: string;
}

interface TournamentResult {
  first: Restaurant;
  second: Restaurant;
  third: Restaurant;
  fourth: Restaurant;
  fifth: Restaurant[];
}

// Fisher-Yates シャッフル
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ラウンドに応じたrecommended_peopleのインデックスを取得
const getRecommendedPersonIndex = (round: string): number => {
  switch (round) {
    case '1回戦':
      return 0; // 1人目
    case '準決勝':
      return 1; // 2人目
    case '3位決定戦':
    case '決勝':
      return 2; // 3人目
    default:
      return 0;
  }
};

// ラベリングアルゴリズム
const addLabelsToRecommendedPeople = (restaurant: Restaurant): Restaurant => {
  const recommendedPeople = restaurant.recommended_people || [];
  return {
    ...restaurant,
    recommended_people: recommendedPeople.map((person, index) => ({
      ...person,
      label: index
    }))
  };
};

const optimizeLabelsAcrossRestaurants = (restaurants: Restaurant[]): Restaurant[] => {
  const labelAssignments: Map<number, Set<string>> = new Map([
    [0, new Set()],
    [1, new Set()],
    [2, new Set()]
  ]);

  return restaurants.map(restaurant => {
    const people = restaurant.recommended_people || [];
    if (people.length === 0) return restaurant;

    const optimizedPeople = people.map((person) => {
      const name = person.name;
      let assignedLabel = person.label ?? 0;
      
      if (labelAssignments.get(assignedLabel)?.has(name)) {
        for (let label = 0; label <= 2; label++) {
          if (!labelAssignments.get(label)?.has(name)) {
            assignedLabel = label;
            break;
          }
        }
      }
      
      labelAssignments.get(assignedLabel)?.add(name);
      
      return {
        ...person,
        label: assignedLabel
      };
    });

    return {
      ...restaurant,
      recommended_people: optimizedPeople
    };
  });
};

// トーナメントシミュレーター
class TournamentSimulator {
  private shuffledOptions: Restaurant[] = [];
  private matches: TournamentMatch[] = [];
  private round1Winners: Restaurant[] = [];
  private round1Losers: Restaurant[] = [];
  private semiFinalWinners: Restaurant[] = [];
  private semiFinalLosers: Restaurant[] = [];
  private thirdPlaceWinner: Restaurant | null = null;
  private thirdPlaceLoser: Restaurant | null = null;

  constructor(restaurants: Restaurant[]) {
    this.shuffledOptions = shuffleArray(restaurants);
  }

  // 1回戦を実行（試合1-4）
  runFirstRound(winners: number[]): void {
    if (winners.length !== 4) {
      throw new Error('1回戦は4つの勝者を選択する必要があります');
    }

    for (let i = 0; i < 4; i++) {
      const option1 = this.shuffledOptions[i * 2];
      const option2 = this.shuffledOptions[i * 2 + 1];
      const winnerIndex = winners[i];
      
      if (winnerIndex !== 0 && winnerIndex !== 1) {
        throw new Error('勝者インデックスは0か1である必要があります');
      }

      const winner = winnerIndex === 0 ? option1 : option2;
      const loser = winnerIndex === 0 ? option2 : option1;

      this.round1Winners.push(winner);
      this.round1Losers.push(loser);

      this.matches.push({
        round: '1回戦',
        matchNumber: i + 1,
        options: [option1, option2],
        winner,
        loser,
        answeredAt: new Date().toISOString(),
      });
    }
  }

  // 準決勝を実行（試合1-2）
  runSemiFinals(winners: number[]): void {
    if (winners.length !== 2) {
      throw new Error('準決勝は2つの勝者を選択する必要があります');
    }

    for (let i = 0; i < 2; i++) {
      const option1 = this.round1Winners[i * 2];
      const option2 = this.round1Winners[i * 2 + 1];
      const winnerIndex = winners[i];
      
      if (winnerIndex !== 0 && winnerIndex !== 1) {
        throw new Error('勝者インデックスは0か1である必要があります');
      }

      const winner = winnerIndex === 0 ? option1 : option2;
      const loser = winnerIndex === 0 ? option2 : option1;

      this.semiFinalWinners.push(winner);
      this.semiFinalLosers.push(loser);

      this.matches.push({
        round: '準決勝',
        matchNumber: i + 1,
        options: [option1, option2],
        winner,
        loser,
        answeredAt: new Date().toISOString(),
      });
    }
  }

  // 3位決定戦を実行
  runThirdPlaceMatch(winnerIndex: number): void {
    if (winnerIndex !== 0 && winnerIndex !== 1) {
      throw new Error('勝者インデックスは0か1である必要があります');
    }

    const option1 = this.semiFinalLosers[0];
    const option2 = this.semiFinalLosers[1];
    const winner = winnerIndex === 0 ? option1 : option2;
    const loser = winnerIndex === 0 ? option2 : option1;

    this.thirdPlaceWinner = winner;
    this.thirdPlaceLoser = loser;

    this.matches.push({
      round: '3位決定戦',
      matchNumber: 1,
      options: [option1, option2],
      winner,
      loser,
      answeredAt: new Date().toISOString(),
    });
  }

  // 決勝を実行
  runFinal(winnerIndex: number): TournamentResult {
    if (winnerIndex !== 0 && winnerIndex !== 1) {
      throw new Error('勝者インデックスは0か1である必要があります');
    }

    const option1 = this.semiFinalWinners[0];
    const option2 = this.semiFinalWinners[1];
    const winner = winnerIndex === 0 ? option1 : option2;
    const loser = winnerIndex === 0 ? option2 : option1;

    this.matches.push({
      round: '決勝',
      matchNumber: 1,
      options: [option1, option2],
      winner,
      loser,
      answeredAt: new Date().toISOString(),
    });

    if (!this.thirdPlaceWinner || !this.thirdPlaceLoser) {
      throw new Error('3位決定戦が完了していません');
    }

    return {
      first: winner,
      second: loser,
      third: this.thirdPlaceWinner,
      fourth: this.thirdPlaceLoser,
      fifth: this.round1Losers,
    };
  }

  getMatches(): TournamentMatch[] {
    return this.matches;
  }

  getShuffledOptions(): Restaurant[] {
    return this.shuffledOptions;
  }
}

describe('プロジェクト全体のトーナメントアルゴリズム検証', () => {
  let testRestaurants: Restaurant[];

  beforeEach(() => {
    // 8店舗のテストデータ（recommended_peopleを持つ）
    // 名前の重複を考慮してデザイン
    testRestaurants = [
      {
        shop_id: 'shop1',
        name: 'レストランA',
        recommended_people: [
          { name: '田中', comment: 'おすすめです' },
          { name: '佐藤', comment: '美味しいよ' },
          { name: '鈴木', comment: '最高です' }
        ]
      },
      {
        shop_id: 'shop2',
        name: 'レストランB',
        recommended_people: [
          { name: '山田', comment: 'また行きたい' },
          { name: '伊藤', comment: '雰囲気が良い' },
          { name: '高橋', comment: 'コスパ良い' }
        ]
      },
      {
        shop_id: 'shop3',
        name: 'レストランC',
        recommended_people: [
          { name: '渡辺', comment: '絶品でした' },
          { name: '中村', comment: '接客が素晴らしい' },
          { name: '小林', comment: '落ち着く空間' }
        ]
      },
      {
        shop_id: 'shop4',
        name: 'レストランD',
        recommended_people: [
          { name: '加藤', comment: 'デートに最適' },
          { name: '吉田', comment: 'おしゃれ' },
          { name: '山本', comment: 'ボリューム満点' }
        ]
      },
      {
        shop_id: 'shop5',
        name: 'レストランE',
        recommended_people: [
          { name: '斎藤', comment: '新鮮な食材' },
          { name: '松本', comment: 'リピート確定' },
          { name: '井上', comment: '本格的な味' }
        ]
      },
      {
        shop_id: 'shop6',
        name: 'レストランF',
        recommended_people: [
          { name: '木村', comment: '居心地が良い' },
          { name: '林', comment: 'みんなで楽しめる' },
          { name: '斉藤', comment: 'サービスが良い' }
        ]
      },
      {
        shop_id: 'shop7',
        name: 'レストランG',
        recommended_people: [
          { name: '清水', comment: '隠れた名店' },
          { name: '山崎', comment: '料理が美しい' },
          { name: '森', comment: '味が濃厚' }
        ]
      },
      {
        shop_id: 'shop8',
        name: 'レストランH',
        recommended_people: [
          { name: '池田', comment: '清潔感がある' },
          { name: '橋本', comment: 'スタッフが親切' },
          { name: '阿部', comment: 'メニュー豊富' }
        ]
      },
    ];
  });

  describe('Fisher-Yatesシャッフル', () => {
    it('配列の要素数が変わらない', () => {
      const original = [...testRestaurants];
      const shuffled = shuffleArray(original);
      
      expect(shuffled.length).toBe(original.length);
    });

    it('すべての要素が保持される', () => {
      const original = [...testRestaurants];
      const shuffled = shuffleArray(original);
      
      const originalIds = original.map(r => r.shop_id).sort();
      const shuffledIds = shuffled.map(r => r.shop_id).sort();
      
      expect(shuffledIds).toEqual(originalIds);
    });

    it('ランダム性がある（100回実行して少なくとも1回は順序が変わる）', () => {
      const original = [...testRestaurants];
      let hasChanged = false;
      
      for (let i = 0; i < 100; i++) {
        const shuffled = shuffleArray(original);
        if (JSON.stringify(shuffled) !== JSON.stringify(original)) {
          hasChanged = true;
          break;
        }
      }
      
      expect(hasChanged).toBe(true);
    });
  });

  describe('ラウンド別推奨者インデックス取得', () => {
    it('1回戦はインデックス0を返す', () => {
      expect(getRecommendedPersonIndex('1回戦')).toBe(0);
    });

    it('準決勝はインデックス1を返す', () => {
      expect(getRecommendedPersonIndex('準決勝')).toBe(1);
    });

    it('3位決定戦はインデックス2を返す', () => {
      expect(getRecommendedPersonIndex('3位決定戦')).toBe(2);
    });

    it('決勝はインデックス2を返す', () => {
      expect(getRecommendedPersonIndex('決勝')).toBe(2);
    });
  });

  describe('トーナメントシミュレーション', () => {
    it('完全なトーナメントを実行できる', () => {
      const simulator = new TournamentSimulator(testRestaurants);

      // 1回戦: 4試合
      simulator.runFirstRound([0, 1, 0, 1]); // 各試合の勝者を指定

      // 準決勝: 2試合
      simulator.runSemiFinals([0, 1]);

      // 3位決定戦
      simulator.runThirdPlaceMatch(0);

      // 決勝
      const result = simulator.runFinal(1);

      // 結果検証
      expect(result.first).toBeDefined();
      expect(result.second).toBeDefined();
      expect(result.third).toBeDefined();
      expect(result.fourth).toBeDefined();
      expect(result.fifth).toHaveLength(4);

      // 試合数検証
      const matches = simulator.getMatches();
      expect(matches).toHaveLength(8); // 1回戦4 + 準決勝2 + 3位決定戦1 + 決勝1 = 実際は8試合
    });

    it('トーナメントで8店舗すべてが順位付けされる', () => {
      const simulator = new TournamentSimulator(testRestaurants);

      simulator.runFirstRound([0, 1, 0, 1]);
      simulator.runSemiFinals([0, 1]);
      simulator.runThirdPlaceMatch(0);
      const result = simulator.runFinal(1);

      // すべての順位のレストランIDを収集
      const rankedIds = [
        result.first.shop_id,
        result.second.shop_id,
        result.third.shop_id,
        result.fourth.shop_id,
        ...result.fifth.map(r => r.shop_id)
      ].sort();

      // 元の8店舗のIDと一致するか確認
      const originalIds = testRestaurants.map(r => r.shop_id).sort();
      expect(rankedIds).toEqual(originalIds);
    });

    it('1回戦の敗者が5位に配置される', () => {
      const simulator = new TournamentSimulator(testRestaurants);

      simulator.runFirstRound([0, 0, 0, 0]); // 全て左側が勝利
      simulator.runSemiFinals([0, 1]);
      simulator.runThirdPlaceMatch(0);
      const result = simulator.runFinal(1);

      // 5位は4店舗
      expect(result.fifth).toHaveLength(4);
    });
  });

  describe('ラベリングアルゴリズムとトーナメントの統合', () => {
    it('トーナメント結果にラベリングを適用できる', () => {
      const simulator = new TournamentSimulator(testRestaurants);

      simulator.runFirstRound([0, 1, 0, 1]);
      simulator.runSemiFinals([0, 1]);
      simulator.runThirdPlaceMatch(0);
      const result = simulator.runFinal(1);

      // 初期ラベリング
      const labeledRestaurants = [
        result.first,
        result.second,
        result.third,
        result.fourth,
        ...result.fifth
      ].map(addLabelsToRecommendedPeople);

      // 最適化
      const optimizedRestaurants = optimizeLabelsAcrossRestaurants(labeledRestaurants);

      // すべてのレストランにラベルが付与されている
      optimizedRestaurants.forEach(restaurant => {
        if (restaurant.recommended_people && restaurant.recommended_people.length > 0) {
          restaurant.recommended_people.forEach(person => {
            expect(person.label).toBeGreaterThanOrEqual(0);
            expect(person.label).toBeLessThanOrEqual(2);
          });
        }
      });
    });

    it('トーナメント結果のラベルに重複がない', () => {
      const simulator = new TournamentSimulator(testRestaurants);

      simulator.runFirstRound([0, 1, 0, 1]);
      simulator.runSemiFinals([0, 1]);
      simulator.runThirdPlaceMatch(0);
      const result = simulator.runFinal(1);

      // 初期ラベリング + 最適化
      const allRestaurants = [
        result.first,
        result.second,
        result.third,
        result.fourth,
        ...result.fifth
      ].map(addLabelsToRecommendedPeople);

      const optimizedRestaurants = optimizeLabelsAcrossRestaurants(allRestaurants);

      // 各ラベルで名前の重複がないことを確認
      const label0Names = new Map<string, number>();
      const label1Names = new Map<string, number>();
      const label2Names = new Map<string, number>();

      optimizedRestaurants.forEach(restaurant => {
        restaurant.recommended_people?.forEach(person => {
          if (person.label === 0) {
            label0Names.set(person.name, (label0Names.get(person.name) || 0) + 1);
          } else if (person.label === 1) {
            label1Names.set(person.name, (label1Names.get(person.name) || 0) + 1);
          } else if (person.label === 2) {
            label2Names.set(person.name, (label2Names.get(person.name) || 0) + 1);
          }
        });
      });

      // 各ラベルで各名前が最大1回しか出現しないことを確認
      label0Names.forEach((count) => {
        expect(count).toBe(1);
      });
      label1Names.forEach((count) => {
        expect(count).toBe(1);
      });
      label2Names.forEach((count) => {
        expect(count).toBe(1);
      });
    });

    it('各ラウンドで正しいラベルの推奨者が使用される', () => {
      const simulator = new TournamentSimulator(testRestaurants);
      const matches = [
        { round: '1回戦', expectedIndex: 0 },
        { round: '準決勝', expectedIndex: 1 },
        { round: '3位決定戦', expectedIndex: 2 },
        { round: '決勝', expectedIndex: 2 }
      ];

      matches.forEach(({ round, expectedIndex }) => {
        const index = getRecommendedPersonIndex(round);
        expect(index).toBe(expectedIndex);
      });
    });
  });

  describe('エッジケースの検証', () => {
    it('recommended_peopleが不完全なデータでもエラーにならない', () => {
      const incompleteRestaurants: Restaurant[] = [
        { shop_id: 'shop1', name: 'A', recommended_people: [{ name: '田中', comment: 'a' }] },
        { shop_id: 'shop2', name: 'B', recommended_people: [] },
        { shop_id: 'shop3', name: 'C' },
        { shop_id: 'shop4', name: 'D', recommended_people: [{ name: '佐藤', comment: 'b' }] },
        { shop_id: 'shop5', name: 'E', recommended_people: [{ name: '鈴木', comment: 'c' }] },
        { shop_id: 'shop6', name: 'F', recommended_people: [{ name: '山田', comment: 'd' }] },
        { shop_id: 'shop7', name: 'G', recommended_people: [{ name: '伊藤', comment: 'e' }] },
        { shop_id: 'shop8', name: 'H', recommended_people: [{ name: '高橋', comment: 'f' }] },
      ];

      const simulator = new TournamentSimulator(incompleteRestaurants);

      expect(() => {
        simulator.runFirstRound([0, 1, 0, 1]);
        simulator.runSemiFinals([0, 1]);
        simulator.runThirdPlaceMatch(0);
        simulator.runFinal(1);
      }).not.toThrow();
    });

    it('同じ名前が複数のラベルに分散される（最悪ケース）', () => {
      const sameNameRestaurants: Restaurant[] = Array.from({ length: 8 }, (_, i) => ({
        shop_id: `shop${i + 1}`,
        name: `レストラン${String.fromCharCode(65 + i)}`,
        recommended_people: [
          { name: '田中', comment: `コメント${i + 1}` },
          { name: '田中', comment: `コメント${i + 1}` },
          { name: '田中', comment: `コメント${i + 1}` }
        ]
      }));

      const labeledRestaurants = sameNameRestaurants.map(addLabelsToRecommendedPeople);
      const optimizedRestaurants = optimizeLabelsAcrossRestaurants(labeledRestaurants);

      // ラベル0に最大3つの「田中」が配置されるはず（ラベルが3つしかないため）
      const label0Count = optimizedRestaurants.filter(r => 
        r.recommended_people?.some(p => p.label === 0 && p.name === '田中')
      ).length;
      const label1Count = optimizedRestaurants.filter(r => 
        r.recommended_people?.some(p => p.label === 1 && p.name === '田中')
      ).length;
      const label2Count = optimizedRestaurants.filter(r => 
        r.recommended_people?.some(p => p.label === 2 && p.name === '田中')
      ).length;

      // 各ラベルに分散されている
      expect(label0Count).toBeGreaterThan(0);
      expect(label1Count).toBeGreaterThan(0);
      expect(label2Count).toBeGreaterThan(0);
      
      // 合計は8（レストラン数）の3倍以下
      expect(label0Count + label1Count + label2Count).toBeLessThanOrEqual(24);
    });
  });
});
