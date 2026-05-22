import { dietTemplateCategoryFormSchema } from '../create/schema'

describe('dietTemplateCategoryFormSchema', () => {
  const validData = {
    name: 'Breakfast',
    status: 'Active',
  }

  it('should validate valid data', () => {
    const result = dietTemplateCategoryFormSchema.safeParse(validData)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.name).toBe('Breakfast')
      expect(result.data.status).toBe('Active')
    }
  })

  it('should fail when name is empty', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      ...validData,
      name: '',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        'Name is required'
      )
    }
  })

  it('should fail when name contains only spaces', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      ...validData,
      name: '   ',
    })

    expect(result.success).toBe(false)
  })

  it('should fail when name has leading spaces', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      ...validData,
      name: '  Breakfast',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        'Leading spaces are not allowed'
      )
    }
  })

  it('should fail when status is empty', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      ...validData,
      status: '',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.status).toContain(
        'Status is required'
      )
    }
  })

  it('should validate status with only spaces (passes because no trim validation)', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      ...validData,
      status: '   ',
    })

    // The schema only checks for min length of 1, and '   ' has length 3
    // So this actually passes validation
    expect(result.success).toBe(true)
  })

  it('should fail when name is undefined', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      status: 'Active',
    })

    expect(result.success).toBe(false)
  })

  it('should fail when status is undefined', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Breakfast',
    })

    expect(result.success).toBe(false)
  })

  it('should fail when all required fields are missing', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('should validate name with single character', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'A',
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should validate name with maximum length', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'A'.repeat(50),
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should validate status with Inactive value', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Breakfast',
      status: 'Inactive',
    })

    expect(result.success).toBe(true)
  })

  it('should allow name with special characters', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Breakfast & Lunch',
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should allow name with numbers', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Meal Plan 1',
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should allow name with hyphens', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Low-Carb Diet',
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should allow name with underscores', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Vegetarian_Meals',
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should trim trailing spaces from name', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Breakfast  ',
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should fail when name is null', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: null,
      status: 'Active',
    })

    expect(result.success).toBe(false)
  })

  it('should fail when status is null', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      name: 'Breakfast',
      status: null,
    })

    expect(result.success).toBe(false)
  })

  it('should ignore extra unknown fields', () => {
    const result = dietTemplateCategoryFormSchema.safeParse({
      ...validData,
      extraField: 'extra',
    })

    expect(result.success).toBe(true)
  })
})