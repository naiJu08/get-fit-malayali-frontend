// // schema.test.ts

// import { mealFormSchema } from "../create/schema"

// // import { mealFormSchema } from '..create/schema'

// describe('mealFormSchema', () => {
//   const validData = {
//     name: 'Breakfast',
//     meal_time: '08:00 AM',
//     notes: 'Healthy meal',
//     meal_category: 'Morning',
//     meal_category_id: { id: 1, label: 'Category 1' },
//     serving_unit: 'Bowl',
//     default_serving_quantity: 1,
//     per_serving_calories: '250',
//     per_serving_protein: '10',
//     per_serving_carbs: '30',
//     per_serving_fat: '5',
//     per_serving_fiber: '3',
//   }

//   it('should validate valid data', () => {
//     const result = mealFormSchema.safeParse(validData)

//     expect(result.success).toBe(true)

//     if (result.success) {
//       expect(result.data.name).toBe('Breakfast')
//       expect(result.data.meal_category_id).toBe(1)
//       expect(result.data.per_serving_calories).toBe(250)
//     }
//   })

//   it('should trim whitespace from string fields', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       name: '  Breakfast  ',
//       meal_time: ' 08:00 AM ',
//       serving_unit: ' Bowl ',
//     })

//     expect(result.success).toBe(true)

//     if (result.success) {
//       expect(result.data.name).toBe('Breakfast')
//       expect(result.data.meal_time).toBe('08:00 AM')
//       expect(result.data.serving_unit).toBe('Bowl')
//     }
//   })

//   it('should fail when name is empty', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       name: '',
//     })

//     expect(result.success).toBe(false)

//     if (!result.success) {
//       expect(result.error.flatten().fieldErrors.name).toContain(
//         'Name is required'
//       )
//     }
//   })

//   it('should fail when name contains only spaces', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       name: '   ',
//     })

//     expect(result.success).toBe(false)

//     if (!result.success) {
//       expect(result.error.flatten().fieldErrors.name).toContain(
//         'Name is required'
//       )
//     }
//   })

//   it('should fail when meal_time is empty', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       meal_time: '',
//     })

//     expect(result.success).toBe(false)

//     if (!result.success) {
//       expect(result.error.flatten().fieldErrors.meal_time).toContain(
//         'Meal time is required'
//       )
//     }
//   })

//   it('should fail when serving_unit is empty', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       serving_unit: '',
//     })

//     expect(result.success).toBe(false)

//     if (!result.success) {
//       expect(result.error.flatten().fieldErrors.serving_unit).toContain(
//         'Serving unit is required'
//       )
//     }
//   })

//   it('should convert numeric strings to numbers', () => {
//     const result = mealFormSchema.safeParse(validData)

//     expect(result.success).toBe(true)

//     if (result.success) {
//       expect(result.data.per_serving_calories).toBe(250)
//       expect(result.data.per_serving_protein).toBe(10)
//       expect(result.data.per_serving_carbs).toBe(30)
//       expect(result.data.per_serving_fat).toBe(5)
//       expect(result.data.per_serving_fiber).toBe(3)
//     }
//   })

//   it('should fail for invalid numeric values', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       per_serving_calories: 'abc',
//     })

//     expect(result.success).toBe(false)

//     if (!result.success) {
//       expect(
//         result.error.flatten().fieldErrors.per_serving_calories
//       ).toContain('Total Calories is required')
//     }
//   })

//   it('should fail for negative numeric values', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       per_serving_protein: '-10',
//     })

//     expect(result.success).toBe(false)

//     if (!result.success) {
//       expect(
//         result.error.flatten().fieldErrors.per_serving_protein
//       ).toContain('Protein cannot be negative')
//     }
//   })

//   it('should use default value for default_serving_quantity', () => {
//     const { default_serving_quantity, ...dataWithoutDefault } = validData

//     const result = mealFormSchema.safeParse(dataWithoutDefault)

//     expect(result.success).toBe(true)

//     if (result.success) {
//       expect(result.data.default_serving_quantity).toBe(1)
//     }
//   })

//   it('should allow optional notes field', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       notes: undefined,
//     })

//     expect(result.success).toBe(true)
//   })

//   it('should allow optional meal_category field', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       meal_category: undefined,
//     })

//     expect(result.success).toBe(true)
//   })

//   it('should extract id from meal_category_id object', () => {
//     const result = mealFormSchema.safeParse({
//       ...validData,
//       meal_category_id: {
//         id: 5,
//         name: 'Lunch',
//       },
//     })

//     expect(result.success).toBe(true)

//     if (result.success) {
//       expect(result.data.meal_category_id).toBe(5)
//     }
//   })

//   it('should fail when meal_category_id is missing', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     meal_category_id: undefined,
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when meal_category_id object has no id', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     meal_category_id: {},
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when default_serving_quantity is negative', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     default_serving_quantity: -1,
//   })

//   expect(result.success).toBe(false)
// })

// it('should allow zero values for numeric fields', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_calories: '0',
//     per_serving_protein: '0',
//     per_serving_carbs: '0',
//     per_serving_fat: '0',
//     per_serving_fiber: '0',
//   })

//   expect(result.success).toBe(true)

//   if (result.success) {
//     expect(result.data.per_serving_calories).toBe(0)
//     expect(result.data.per_serving_protein).toBe(0)
//   }
// })

// it('should fail when calories is negative', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_calories: '-100',
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when carbs is negative', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_carbs: '-5',
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when fat is negative', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_fat: '-1',
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when fiber is negative', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_fiber: '-2',
//   })

//   expect(result.success).toBe(false)
// })

// it('should trim notes field', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     notes: '  Healthy breakfast  ',
//   })

//   expect(result.success).toBe(true)

//   if (result.success) {
//     expect(result.data.notes).toBe('Healthy breakfast')
//   }
// })

// it('should handle null notes gracefully', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     notes: null,
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when serving quantity is string', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     default_serving_quantity: 'abc',
//   })

//   expect(result.success).toBe(false)
// })

// it('should allow decimal numeric values', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_calories: '250.5',
//     per_serving_protein: '10.2',
//   })

//   expect(result.success).toBe(true)

//   if (result.success) {
//     expect(result.data.per_serving_calories).toBe(250.5)
//     expect(result.data.per_serving_protein).toBe(10.2)
//   }
// })

// it('should fail when name is undefined', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     name: undefined,
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when meal_time is undefined', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     meal_time: undefined,
//   })

//   expect(result.success).toBe(false)
// })

// it('should fail when serving_unit is undefined', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     serving_unit: undefined,
//   })

//   expect(result.success).toBe(false)
// })

// it('should parse numeric values passed as numbers', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_calories: 200,
//     per_serving_protein: 20,
//     per_serving_carbs: 30,
//     per_serving_fat: 10,
//     per_serving_fiber: 5,
//   })

//   expect(result.success).toBe(true)

//   if (result.success) {
//     expect(result.data.per_serving_calories).toBe(200)
//     expect(result.data.per_serving_protein).toBe(20)
//   }
// })

// it('should fail when all required fields are empty', () => {
//   const result = mealFormSchema.safeParse({
//     name: '',
//     meal_time: '',
//     serving_unit: '',
//     meal_category_id: undefined,
//   })

//   expect(result.success).toBe(false)
// })

// it('should handle extra unknown fields', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     extra_field: 'extra',
//   })

//   expect(result.success).toBe(true)
// })

// it('should allow large numeric values', () => {
//   const result = mealFormSchema.safeParse({
//     ...validData,
//     per_serving_calories: '99999',
//   })

//   expect(result.success).toBe(true)

//   if (result.success) {
//     expect(result.data.per_serving_calories).toBe(99999)
//   }
// })
// })

// schema.test.ts

import { mealFormSchema } from '../create/schema'

describe('mealFormSchema', () => {
  const validData = {
    name: 'Breakfast',
    meal_time: '08:00 AM',
    notes: 'Healthy meal',
    meal_category: 'Morning',
    meal_category_id: { id: 1, label: 'Category 1' },
    serving_unit: 'Bowl',
    default_serving_quantity: 1,
    per_serving_calories: '250',
    per_serving_protein: '10',
    per_serving_carbs: '30',
    per_serving_fat: '5',
    per_serving_fiber: '3',
  }

  it('should validate valid data', () => {
    const result = mealFormSchema.safeParse(validData)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.name).toBe('Breakfast')
      expect(result.data.meal_category_id).toBe(1)
      expect(result.data.per_serving_calories).toBe(250)
    }
  })

  it('should trim whitespace from string fields', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      name: '  Breakfast  ',
      meal_time: ' 08:00 AM ',
      serving_unit: ' Bowl ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.name).toBe('Breakfast')
      expect(result.data.meal_time).toBe('08:00 AM')
      expect(result.data.serving_unit).toBe('Bowl')
    }
  })

  it('should fail when name is empty', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      name: '',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.name
      ).toContain('Name is required')
    }
  })

  it('should fail when name contains only spaces', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      name: '   ',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.name
      ).toContain('Name is required')
    }
  })

  it('should fail when meal_time is empty', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_time: '',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.meal_time
      ).toContain('Meal time is required')
    }
  })

  it('should fail when meal_time contains only spaces', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_time: '   ',
    })

    expect(result.success).toBe(false)
  })

  it('should fail when serving_unit is empty', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      serving_unit: '',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors
          .serving_unit
      ).toContain('Serving unit is required')
    }
  })

  it('should fail when serving_unit contains only spaces', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      serving_unit: '   ',
    })

    expect(result.success).toBe(false)
  })

  it('should convert numeric strings to numbers', () => {
    const result = mealFormSchema.safeParse(validData)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(
        result.data.per_serving_calories
      ).toBe(250)

      expect(
        result.data.per_serving_protein
      ).toBe(10)

      expect(
        result.data.per_serving_carbs
      ).toBe(30)

      expect(result.data.per_serving_fat).toBe(5)

      expect(
        result.data.per_serving_fiber
      ).toBe(3)
    }
  })

  it('should allow decimal numeric values', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_calories: '250.5',
      per_serving_protein: '10.2',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(
        result.data.per_serving_calories
      ).toBe(250.5)

      expect(
        result.data.per_serving_protein
      ).toBe(10.2)
    }
  })

  it('should allow numeric values directly', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_calories: 250,
      per_serving_protein: 10,
      per_serving_carbs: 30,
      per_serving_fat: 5,
      per_serving_fiber: 3,
    })

    expect(result.success).toBe(true)
  })

  it('should allow zero values for numeric fields', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_calories: '0',
      per_serving_protein: '0',
      per_serving_carbs: '0',
      per_serving_fat: '0',
      per_serving_fiber: '0',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(
        result.data.per_serving_calories
      ).toBe(0)

      expect(
        result.data.per_serving_protein
      ).toBe(0)

      expect(
        result.data.per_serving_carbs
      ).toBe(0)

      expect(result.data.per_serving_fat).toBe(0)

      expect(
        result.data.per_serving_fiber
      ).toBe(0)
    }
  })

  it('should fail for invalid numeric values', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_calories: 'abc',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors
          .per_serving_calories
      ).toContain('Total Calories is required')
    }
  })

  it('should fail for invalid protein value', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_protein: 'invalid',
    })

    expect(result.success).toBe(false)
  })

  it('should fail for invalid carbs value', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_carbs: 'invalid',
    })

    expect(result.success).toBe(false)
  })

  it('should fail for invalid fat value', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_fat: 'invalid',
    })

    expect(result.success).toBe(false)
  })

  it('should fail for invalid fiber value', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_fiber: 'invalid',
    })

    expect(result.success).toBe(false)
  })

  it('should fail for negative numeric values', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      per_serving_protein: '-10',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors
          .per_serving_protein
      ).toContain('Protein cannot be negative')
    }
  })

  it('should use default value for default_serving_quantity', () => {
    const {
      default_serving_quantity,
      ...dataWithoutDefault
    } = validData

    const result = mealFormSchema.safeParse(
      dataWithoutDefault
    )

    expect(result.success).toBe(true)

    if (result.success) {
      expect(
        result.data.default_serving_quantity
      ).toBe(1)
    }
  })

  it('should allow negative default_serving_quantity if schema allows it', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      default_serving_quantity: -1,
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(
        result.data.default_serving_quantity
      ).toBe(-1)
    }
  })

  it('should allow optional notes field', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      notes: undefined,
    })

    expect(result.success).toBe(true)
  })

  it('should allow empty notes string', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      notes: '',
    })

    expect(result.success).toBe(true)
  })

  it('should keep notes field unchanged if schema does not trim it', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      notes: '  Healthy breakfast  ',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.notes).toBe(
        '  Healthy breakfast  '
      )
    }
  })

  it('should allow optional meal_category field', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_category: undefined,
    })

    expect(result.success).toBe(true)
  })

  it('should extract id from meal_category_id object', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_category_id: {
        id: 5,
        name: 'Lunch',
      },
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.meal_category_id).toBe(5)
    }
  })

  it('should fail when meal_category_id is missing', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_category_id: undefined,
    })

    expect(result.success).toBe(false)
  })

  it('should fail when meal_category_id object has no id', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_category_id: {},
    })

    expect(result.success).toBe(false)
  })

  it('should fail when meal_category_id is null', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_category_id: null,
    })

    expect(result.success).toBe(false)
  })

  it('should fail when name is undefined', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      name: undefined,
    })

    expect(result.success).toBe(false)
  })

  it('should fail when meal_time is undefined', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      meal_time: undefined,
    })

    expect(result.success).toBe(false)
  })

  it('should fail when serving_unit is undefined', () => {
    const result = mealFormSchema.safeParse({
      ...validData,
      serving_unit: undefined,
    })

    expect(result.success).toBe(false)
  })
})