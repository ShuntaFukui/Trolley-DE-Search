import { describe, it, expect } from 'vitest';

// ラベリング関数を抽出してテスト可能にする
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
      let assignedLabel = person.label;
      
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

describe('ResultPage ラベリングアルゴリズム', () => {
  describe('addLabelsToRecommendedPeople', () => {
    it('配列のインデックス順にラベルを付与する', () => {
      const restaurant = {
        name: 'レストランA',
        recommended_people: [
          { name: '田中', age: 30 },
          { name: '佐藤', age: 25 },
          { name: '鈴木', age: 28 }
        ]
      };

      const result = addLabelsToRecommendedPeople(restaurant);

      expect(result).toEqual([
        { name: '田中', age: 30, label: 0 },
        { name: '佐藤', age: 25, label: 1 },
        { name: '鈴木', age: 28, label: 2 }
      ]);
    });

    it('recommended_peopleが空の場合は空配列を返す', () => {
      const restaurant = { name: 'レストランB' };
      const result = addLabelsToRecommendedPeople(restaurant);
      expect(result).toEqual([]);
    });
  });

  describe('optimizeLabelsAcrossRestaurants', () => {
    it('同じラベルに同じ名前が重複しないようにラベルを調整する', () => {
      const restaurants = [
        {
          name: 'レストラン1',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '佐藤', label: 1 },
            { name: '鈴木', label: 2 }
          ]
        },
        {
          name: 'レストラン2',
          recommended_people: [
            { name: '田中', label: 0 }, // 重複
            { name: '山田', label: 1 },
            { name: '伊藤', label: 2 }
          ]
        }
      ];

      const result = optimizeLabelsAcrossRestaurants(restaurants);

      // 1店目は変更なし
      expect(result[0].recommended_people[0]).toEqual({ name: '田中', label: 0 });
      expect(result[0].recommended_people[1]).toEqual({ name: '佐藤', label: 1 });
      expect(result[0].recommended_people[2]).toEqual({ name: '鈴木', label: 2 });

      // 2店目の田中は別のラベルに移動される
      expect(result[1].recommended_people[0].name).toBe('田中');
      expect(result[1].recommended_people[0].label).not.toBe(0);
    });

    it('複数のレストランで同じ名前が異なるラベルに分散される', () => {
      const restaurants = [
        {
          name: 'レストラン1',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '佐藤', label: 1 },
            { name: '鈴木', label: 2 }
          ]
        },
        {
          name: 'レストラン2',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '佐藤', label: 1 },
            { name: '鈴木', label: 2 }
          ]
        },
        {
          name: 'レストラン3',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '山田', label: 1 },
            { name: '伊藤', label: 2 }
          ]
        }
      ];

      const result = optimizeLabelsAcrossRestaurants(restaurants);

      // すべてのラベル0を収集
      const label0Names = result.map(r => 
        r.recommended_people.find((p: any) => p.label === 0)?.name
      );
      // すべてのラベル1を収集
      const label1Names = result.map(r => 
        r.recommended_people.find((p: any) => p.label === 1)?.name
      );
      // すべてのラベル2を収集
      const label2Names = result.map(r => 
        r.recommended_people.find((p: any) => p.label === 2)?.name
      );

      // 各ラベル内で名前が重複していないことを確認
      expect(new Set(label0Names).size).toBe(label0Names.length);
      expect(new Set(label1Names).size).toBe(label1Names.length);
      expect(new Set(label2Names).size).toBe(label2Names.length);
    });

    it('全てのラベルが埋まっている場合でも処理が完了する', () => {
      const restaurants = [
        {
          name: 'レストラン1',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '佐藤', label: 1 },
            { name: '鈴木', label: 2 }
          ]
        },
        {
          name: 'レストラン2',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '佐藤', label: 1 },
            { name: '鈴木', label: 2 }
          ]
        },
        {
          name: 'レストラン3',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '佐藤', label: 1 },
            { name: '鈴木', label: 2 }
          ]
        },
        {
          name: 'レストラン4',
          recommended_people: [
            { name: '田中', label: 0 },
            { name: '佐藤', label: 1 },
            { name: '鈴木', label: 2 }
          ]
        }
      ];

      const result = optimizeLabelsAcrossRestaurants(restaurants);

      // 処理が完了し、4店舗すべてが返される
      expect(result).toHaveLength(4);
      
      // 各レストランにrecommended_peopleが存在する
      result.forEach(restaurant => {
        expect(restaurant.recommended_people).toHaveLength(3);
      });
    });

    it('recommended_peopleが空のレストランはそのまま返される', () => {
      const restaurants = [
        {
          name: 'レストラン1',
          recommended_people: [
            { name: '田中', label: 0 }
          ]
        },
        {
          name: 'レストラン2',
          recommended_people: []
        },
        {
          name: 'レストラン3'
        }
      ];

      const result = optimizeLabelsAcrossRestaurants(restaurants);

      expect(result[0].recommended_people).toHaveLength(1);
      expect(result[1].recommended_people).toEqual([]);
      expect(result[2].recommended_people).toBeUndefined();
    });

    it('統合テスト: 初期ラベリング + 最適化', () => {
      // 実際の使用フローをシミュレート
      const rawRestaurants = [
        {
          name: 'レストラン1',
          recommended_people: [
            { name: '田中', age: 30 },
            { name: '佐藤', age: 25 },
            { name: '鈴木', age: 28 }
          ]
        },
        {
          name: 'レストラン2',
          recommended_people: [
            { name: '田中', age: 32 },
            { name: '山田', age: 27 },
            { name: '伊藤', age: 29 }
          ]
        },
        {
          name: 'レストラン3',
          recommended_people: [
            { name: '佐藤', age: 26 },
            { name: '鈴木', age: 31 },
            { name: '高橋', age: 24 }
          ]
        }
      ];

      // Step 1: 初期ラベリング
      const labeledRestaurants = rawRestaurants.map(r => ({
        ...r,
        recommended_people: addLabelsToRecommendedPeople(r)
      }));

      // Step 2: 最適化
      const optimizedRestaurants = optimizeLabelsAcrossRestaurants(labeledRestaurants);

      // 検証: 各ラベルで名前が重複していないか
      const label0Names = new Set<string>();
      const label1Names = new Set<string>();
      const label2Names = new Set<string>();

      optimizedRestaurants.forEach(restaurant => {
        restaurant.recommended_people.forEach((person: any) => {
          if (person.label === 0) {
            expect(label0Names.has(person.name)).toBe(false);
            label0Names.add(person.name);
          } else if (person.label === 1) {
            expect(label1Names.has(person.name)).toBe(false);
            label1Names.add(person.name);
          } else if (person.label === 2) {
            expect(label2Names.has(person.name)).toBe(false);
            label2Names.add(person.name);
          }
        });
      });

      // すべての人が何らかのラベルに割り当てられている
      expect(label0Names.size + label1Names.size + label2Names.size).toBe(9);
    });
  });
});
