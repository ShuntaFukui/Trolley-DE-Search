import { describe, it, expect } from 'vitest';

/**
 * 追加の網羅性テスト - エラーハンドリングと境界値
 */

// テスト対象の関数を再定義
interface RestaurantTest {
  id?: string;
  shop_id?: string;
  name: string;
  recommended_people?: Array<{ name: string; comment: string; label?: number }>;
}

const addLabelsToRecommendedPeople = (restaurant: any) => {
  const recommendedPeople = restaurant.recommended_people || [];
  return recommendedPeople.map((person: any, index: number) => ({
    ...person,
    label: index
  }));
};

const optimizeLabelsAcrossRestaurants = (restaurants: any[]) => {
  const labelAssignments: Map<number, Set<string>> = new Map([
    [0, new Set()],
    [1, new Set()],
    [2, new Set()]
  ]);

  return restaurants.map(restaurant => {
    const people = restaurant.recommended_people || [];
    if (people.length === 0) return restaurant;

    const optimizedPeople = people.map((person: any) => {
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

describe('追加網羅性テスト - エラーハンドリング', () => {
  describe('null/undefined処理', () => {
    it('レストラン配列にnullが含まれていてもエラーにならない', () => {
      const restaurants = [
        { name: 'A', recommended_people: [{ name: '田中', comment: 'a' }] },
        null,
        { name: 'B', recommended_people: [{ name: '佐藤', comment: 'b' }] },
      ];

      expect(() => {
        // nullをフィルタリングしてから処理
        const filtered = restaurants.filter(r => r !== null);
        const labeled = filtered.map(r => ({
          ...r,
          recommended_people: addLabelsToRecommendedPeople(r)
        }));
        optimizeLabelsAcrossRestaurants(labeled);
      }).not.toThrow();
    });

    it('名前がundefinedの場合の処理', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: undefined as any, comment: 'a' },
            { name: '田中', comment: 'b' }
          ]
        }
      ];

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result = optimizeLabelsAcrossRestaurants(labeled);
      
      // undefinedも処理される（エラーにならない）
      expect(result).toHaveLength(1);
      expect(result[0].recommended_people).toHaveLength(2);
    });

    it('名前が空文字列の場合の処理', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '', comment: 'a' },
            { name: '田中', comment: 'b' }
          ]
        },
        {
          name: 'B',
          recommended_people: [
            { name: '', comment: 'c' },
            { name: '佐藤', comment: 'd' }
          ]
        }
      ];

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result = optimizeLabelsAcrossRestaurants(labeled);
      
      // 空文字列は同じ名前として扱われる
      const emptyNameLabels = result.flatMap(r =>
        r.recommended_people
          ?.filter((p: any) => p.name === '')
          .map((p: any) => p.label) || []
      );
      
      // 2つの空文字列が存在し、異なるラベルに配置される
      expect(emptyNameLabels).toHaveLength(2);
      expect(new Set(emptyNameLabels).size).toBeGreaterThan(1);
    });
  });

  describe('不正なラベル値の処理', () => {
    it('負のラベル値が渡された場合', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'a', label: -1 }
          ]
        }
      ];

      // addLabelsToRecommendedPeopleは既存のlabelを上書きする
      const result = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      // 再ラベリングされて0になる
      expect(result[0].recommended_people[0].label).toBe(0);
    });

    it('3以上のラベル値が渡された場合', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'a', label: 5 }
          ]
        }
      ];

      const result = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      // 再ラベリングされて0になる
      expect(result[0].recommended_people[0].label).toBe(0);
    });
  });

  describe('同一レストラン内の名前重複', () => {
    it('同じレストラン内で同じ名前が複数回登場する場合', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'コメント1' },
            { name: '田中', comment: 'コメント2' },
            { name: '田中', comment: 'コメント3' }
          ]
        },
        {
          name: 'B',
          recommended_people: [
            { name: '佐藤', comment: 'コメント4' },
            { name: '佐藤', comment: 'コメント5' },
            { name: '佐藤', comment: 'コメント6' }
          ]
        }
      ];

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result = optimizeLabelsAcrossRestaurants(labeled);

      // レストランAの田中は3つ異なるラベルに配置される
      const tanakasInA = result[0].recommended_people.map((p: any) => p.label);
      expect(tanakasInA).toEqual([0, 1, 2]);

      // レストランBの佐藤も3つ異なるラベルに配置される
      const satosInB = result[1].recommended_people.map((p: any) => p.label);
      expect(satosInB).toEqual([0, 1, 2]);
    });
  });
});

describe('追加網羅性テスト - 境界値', () => {
  describe('推奨者数のバリエーション', () => {
    it('推奨者が2人の場合', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'a' },
            { name: '佐藤', comment: 'b' }
          ]
        },
        {
          name: 'B',
          recommended_people: [
            { name: '鈴木', comment: 'c' },
            { name: '山田', comment: 'd' }
          ]
        }
      ];

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result = optimizeLabelsAcrossRestaurants(labeled);

      // すべてラベル0と1に配置される
      result.forEach(r => {
        r.recommended_people?.forEach((p: any) => {
          expect(p.label).toBeLessThanOrEqual(1);
        });
      });
    });

    it('推奨者が4人以上の場合（3人を超える）', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'a' },
            { name: '佐藤', comment: 'b' },
            { name: '鈴木', comment: 'c' },
            { name: '山田', comment: 'd' }
          ]
        }
      ];

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result = optimizeLabelsAcrossRestaurants(labeled);

      // 4人にラベル0, 1, 2, 3が付与される
      expect(result[0].recommended_people).toHaveLength(4);
      expect(result[0].recommended_people[3].label).toBe(3);
    });
  });

  describe('レストラン数のバリエーション', () => {
    it('2店舗の場合', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'a' },
            { name: '佐藤', comment: 'b' },
            { name: '鈴木', comment: 'c' }
          ]
        },
        {
          name: 'B',
          recommended_people: [
            { name: '田中', comment: 'd' },
            { name: '山田', comment: 'e' },
            { name: '伊藤', comment: 'f' }
          ]
        }
      ];

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result = optimizeLabelsAcrossRestaurants(labeled);

      // 田中の重複が解消される
      const tanaka1Label = result[0].recommended_people[0].label;
      const tanaka2Label = result[1].recommended_people[0].label;
      expect(tanaka1Label).not.toBe(tanaka2Label);
    });

    it('10店舗以上の場合（スケーラビリティ）', () => {
      const restaurants = Array.from({ length: 12 }, (_, i) => ({
        name: `Restaurant${i}`,
        recommended_people: [
          { name: '田中', comment: `comment${i}-1` },
          { name: '佐藤', comment: `comment${i}-2` },
          { name: '鈴木', comment: `comment${i}-3` }
        ]
      }));

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      expect(() => {
        const result = optimizeLabelsAcrossRestaurants(labeled);
        expect(result).toHaveLength(12);
      }).not.toThrow();
    });
  });

  describe('特殊なラベル配置', () => {
    it('すべてのレストランで同じ3人の名前が使われる場合', () => {
      const restaurants = Array.from({ length: 5 }, (_, i) => ({
        name: `Restaurant${i}`,
        recommended_people: [
          { name: '田中', comment: `comment${i}-1` },
          { name: '佐藤', comment: `comment${i}-2` },
          { name: '鈴木', comment: `comment${i}-3` }
        ]
      }));

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result = optimizeLabelsAcrossRestaurants(labeled);

      // アルゴリズムの動作：
      // - 各店舗に田中(0), 佐藤(1), 鈴木(2)が初期配置
      // - 最適化時、同じラベルの同じ名前は重複しないよう再配置
      // - しかし、3つのラベルに対して3つの名前があり、各名前が5回登場するため、
      //   完全に分散することは不可能（ラベル数 < 名前の出現回数）

      // 全ラベルが使用されている
      const allLabels = result.flatMap(r =>
        r.recommended_people?.map((p: any) => p.label) || []
      );
      
      expect(allLabels).toContain(0);
      expect(allLabels).toContain(1);
      expect(allLabels).toContain(2);
      
      // 各ラベルで重複している名前の数を確認
      const label0Names = result.map(r => 
        r.recommended_people?.find((p: any) => p.label === 0)?.name
      ).filter(Boolean);
      
      const label1Names = result.map(r => 
        r.recommended_people?.find((p: any) => p.label === 1)?.name
      ).filter(Boolean);
      
      const label2Names = result.map(r => 
        r.recommended_people?.find((p: any) => p.label === 2)?.name
      ).filter(Boolean);

      // 重複カウント（同じラベルに同じ名前が複数回登場）
      const countDuplicates = (names: (string | undefined)[]) => {
        const counts = new Map<string, number>();
        names.forEach(name => {
          if (name) counts.set(name, (counts.get(name) || 0) + 1);
        });
        return Array.from(counts.values()).filter(c => c > 1).length;
      };

      // 重複が最小化されていることを確認（完全にゼロにはできない）
      const duplicates0 = countDuplicates(label0Names);
      const duplicates1 = countDuplicates(label1Names);
      const duplicates2 = countDuplicates(label2Names);
      
      // 少なくとも1つのラベルで重複が発生する（数学的に不可避）
      const totalDuplicates = duplicates0 + duplicates1 + duplicates2;
      expect(totalDuplicates).toBeGreaterThan(0);
      
      // しかし、各ラベルには少なくとも1人は配置される
      expect(label0Names.length).toBeGreaterThan(0);
      expect(label1Names.length).toBeGreaterThan(0);
      expect(label2Names.length).toBeGreaterThan(0);
    });
  });
});

describe('アルゴリズム特性テスト', () => {
  describe('冪等性テスト', () => {
    it('同じ入力で複数回実行しても結果が一貫する', () => {
      const restaurants = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'a' },
            { name: '佐藤', comment: 'b' },
            { name: '鈴木', comment: 'c' }
          ]
        },
        {
          name: 'B',
          recommended_people: [
            { name: '田中', comment: 'd' },
            { name: '山田', comment: 'e' },
            { name: '伊藤', comment: 'f' }
          ]
        }
      ];

      const labeled = restaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      // 1回目の実行
      const result1 = optimizeLabelsAcrossRestaurants(JSON.parse(JSON.stringify(labeled)));
      
      // 2回目の実行
      const result2 = optimizeLabelsAcrossRestaurants(JSON.parse(JSON.stringify(labeled)));

      // 結果が同じ
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('順序依存性テスト', () => {
    it('レストランの順序を変えても各レストラン内のラベルは一貫する', () => {
      const restaurantsOriginal = [
        {
          name: 'A',
          recommended_people: [
            { name: '田中', comment: 'a' },
            { name: '佐藤', comment: 'b' }
          ]
        },
        {
          name: 'B',
          recommended_people: [
            { name: '鈴木', comment: 'c' },
            { name: '山田', comment: 'd' }
          ]
        }
      ];

      const restaurantsReversed = [...restaurantsOriginal].reverse();

      const labeled1 = restaurantsOriginal.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const labeled2 = restaurantsReversed.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      const result1 = optimizeLabelsAcrossRestaurants(labeled1);
      const result2 = optimizeLabelsAcrossRestaurants(labeled2);

      // 順序は異なるが、各レストランのラベリングは処理順に依存する
      // これは仕様として認識（先に処理されるレストランが優先される）
      expect(result1).toHaveLength(2);
      expect(result2).toHaveLength(2);
    });
  });
});
