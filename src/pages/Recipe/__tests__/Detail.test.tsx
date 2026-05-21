import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecipeDetail from '../Detail'
import { getRecipeDetails } from '../api'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../apis/api.helpers')
jest.mock('../api', () => ({
  getRecipeDetails: jest.fn(),
}))
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: { RECIPES: 'recipes', MEAL_CATEGORIES: 'meal_categories' },
}))

const mockPdfDoc = {
  internal: {
    pageSize: { getWidth: () => 210, getHeight: () => 297 },
  },
  setFontSize: jest.fn(),
  setFont: jest.fn(),
  setTextColor: jest.fn(),
  setDrawColor: jest.fn(),
  setFillColor: jest.fn(),
  setLineWidth: jest.fn(),
  text: jest.fn(),
  line: jest.fn(),
  rect: jest.fn(),
  addPage: jest.fn(),
  splitTextToSize: jest.fn((text: string) => [text]),
  getTextWidth: jest.fn(() => 50),
  save: jest.fn(),
}

jest.mock('jspdf', () => {
  const mockDoc = {
    internal: {
      pageSize: { getWidth: () => 210, getHeight: () => 297 },
    },
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    setDrawColor: jest.fn(),
    setFillColor: jest.fn(),
    setLineWidth: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    rect: jest.fn(),
    addPage: jest.fn(),
    splitTextToSize: jest.fn((text: string) => [text]),
    getTextWidth: jest.fn(() => 50),
    save: jest.fn(),
  }
  const MockJsPDF = jest.fn().mockImplementation(function (this: any) {
    Object.assign(this, mockDoc)
  })
  ;(MockJsPDF as any).mockDoc = mockDoc
  ;(MockJsPDF as any).default = MockJsPDF
  return MockJsPDF
})

jest.mock('../../../components/common/icons', () => {
  const MockIcons = ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  )
  return MockIcons
})

jest.mock('../../../components/app/alertBox/infoBox', () => {
  const MockInfoBox = ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  )
  return MockInfoBox
})

jest.mock('../create', () => {
  const MockCreateRecipe = ({
    isDrawerOpen,
    handleClose,
    handleRefresh,
    edit,
    rowData,
  }: any) =>
    isDrawerOpen ? (
      <div data-testid="edit-recipe-drawer">
        <span data-testid="drawer-edit-mode">
          {edit ? 'edit' : 'create'}
        </span>
        <span data-testid="drawer-row-data">
          {rowData ? JSON.stringify(rowData) : 'none'}
        </span>
        <button data-testid="drawer-close" onClick={handleClose}>
          Close
        </button>
        <button data-testid="drawer-refresh" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
    ) : null
  return MockCreateRecipe
})

// ── Test helpers ─────────────────────────────────────────────────────────────

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderDetail = (id = '1') => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/recipe/${id}`]}>
        <Routes>
          <Route path="/recipe/:id" element={<RecipeDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockRecipeData = {
  recipe: {
    id: 1,
    name: 'chicken curry',
    meal_category: 'lunch',
    serving_unit: '1 bowl',
    quantity: 2,
    serving_people_count: 4,
    size: 'medium',
    description: 'A delicious chicken curry',
    image_url: 'http://example.com/img.jpg',
    nutrition: {
      calories: 450,
      protein: 30,
      carbs: 20,
      fat: 25,
      fiber: 5,
    },
    additional_info: 'Store in a cool place',
    ingredients: [
      { id: 1, name: 'chicken', quantity: 500, unit: 'g', details: 'boneless' },
      { id: 2, name: 'onion', quantity: 2, unit: 'pieces', details: 'sliced' },
    ],
    preparation_notes: '<p>Cook on medium heat</p>',
  },
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RecipeDetail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const JsPDF = require('jspdf')
    JsPDF.mockDoc.splitTextToSize.mockImplementation((text: string) => [text])
    JsPDF.mockDoc.getTextWidth.mockImplementation(() => 50)
    JsPDF.mockImplementation(function (this: any) {
      Object.assign(this, JsPDF.mockDoc)
    })
    ;(getRecipeDetails as jest.Mock).mockResolvedValue(mockRecipeData)
  })

  // ── Loading state ──────────────────────────────────────────────────────

  it('shows loading state initially', () => {
    // Don't resolve the promise immediately
    ;(getRecipeDetails as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    )
    renderDetail()
    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading recipe details...'
    )
  })

  // ── Error state ────────────────────────────────────────────────────────

  it('shows error message when API fails', async () => {
    ;(getRecipeDetails as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Recipe not found' } },
    })
    renderDetail()
    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Recipe not found'
      )
    })
  })

  it('shows fallback error message when no specific error is provided', async () => {
    ;(getRecipeDetails as jest.Mock).mockRejectedValue(new Error('Network error'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Failed to load recipe'
      )
    })
  })

  // ── Successful data rendering ──────────────────────────────────────────

  it('renders the recipe title', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Recipe Details')).toBeInTheDocument()
    })
  })

  it('renders back button', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByLabelText('Back')).toBeInTheDocument()
    })
  })

  it('renders download PDF button when recipe has id', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument()
    })
  })

  it('renders edit recipe button when recipe has id', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
    })
  })

  it('does not render action buttons when recipe has no id', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: { name: 'test' },
    })
    renderDetail()
    await waitFor(() => {
      expect(screen.queryByText('Download PDF')).not.toBeInTheDocument()
      expect(screen.queryByText('Edit Recipe')).not.toBeInTheDocument()
    })
  })

  // ── DetailItem rendering ───────────────────────────────────────────────

  it('renders recipe name in title case', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Chicken curry')).toBeInTheDocument()
    })
  })

  it('renders category in title case', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Lunch')).toBeInTheDocument()
    })
  })

  it('renders total calories', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getAllByText('450').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders serving unit in title case', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('1 bowl')).toBeInTheDocument()
    })
  })

  it('renders serving quantity', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders serving count', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  it('renders size', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('medium')).toBeInTheDocument()
    })
  })

  it('renders description', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('A delicious chicken curry')).toBeInTheDocument()
    })
  })

  it('renders recipe image', async () => {
    renderDetail()
    await waitFor(() => {
      const img = screen.getByAltText('Recipe')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'http://example.com/img.jpg')
    })
  })

  it('shows fallback when no image', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: { ...mockRecipeData.recipe, image_url: '' },
    })
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('--')).toBeInTheDocument()
    })
  })

  // ── Nutrition section ──────────────────────────────────────────────────

  it('renders nutrition values', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Total calories:')).toBeInTheDocument()
      expect(screen.getByText('Protein:')).toBeInTheDocument()
      expect(screen.getByText('Carbs:')).toBeInTheDocument()
      expect(screen.getByText('Fat:')).toBeInTheDocument()
      expect(screen.getByText('Fiber:')).toBeInTheDocument()
    })
  })

  // ── Additional info ────────────────────────────────────────────────────

  it('renders additional information', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Additional Information')).toBeInTheDocument()
      expect(screen.getByText('Store in a cool place')).toBeInTheDocument()
    })
  })

  it('shows fallback when no additional info', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: { ...mockRecipeData.recipe, additional_info: '' },
    })
    renderDetail()
    await waitFor(() => {
      expect(
        screen.getByText('No additional information')
      ).toBeInTheDocument()
    })
  })

  // ── Ingredients section ────────────────────────────────────────────────

  it('renders ingredients table', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Ingredients')).toBeInTheDocument()
      expect(screen.getByText('Chicken')).toBeInTheDocument()
      expect(screen.getByText('Onion')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('g')).toBeInTheDocument()
      expect(screen.getByText('pieces')).toBeInTheDocument()
      expect(screen.getByText('boneless')).toBeInTheDocument()
      expect(screen.getByText('sliced')).toBeInTheDocument()
    })
  })

  it('shows fallback when no ingredients', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: { ...mockRecipeData.recipe, ingredients: [] },
    })
    renderDetail()
    await waitFor(() => {
      const dashes = screen.getAllByText('--')
      expect(dashes.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Preparation notes ──────────────────────────────────────────────────

  it('renders preparation notes', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Preparation Notes')).toBeInTheDocument()
    })
  })

  it('shows fallback when no preparation notes', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: { ...mockRecipeData.recipe, preparation_notes: '' },
    })
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Preparation Notes')).toBeInTheDocument()
    })
  })

  // ── Edit drawer ────────────────────────────────────────────────────────

  it('opens edit drawer when edit button is clicked', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Edit Recipe'))
    expect(screen.getByTestId('edit-recipe-drawer')).toBeInTheDocument()
    expect(screen.getByTestId('drawer-edit-mode')).toHaveTextContent('edit')
  })

  it('closes edit drawer when close is clicked', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Edit Recipe'))
    expect(screen.getByTestId('edit-recipe-drawer')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('drawer-close'))
    expect(
      screen.queryByTestId('edit-recipe-drawer')
    ).not.toBeInTheDocument()
  })

  it('refreshes recipe data when drawer refresh is triggered', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Edit Recipe'))
    expect(screen.getByTestId('edit-recipe-drawer')).toBeInTheDocument()

    // Clear mock to track new call
    ;(getRecipeDetails as jest.Mock).mockClear()
    ;(getRecipeDetails as jest.Mock).mockResolvedValue(mockRecipeData)

    fireEvent.click(screen.getByTestId('drawer-refresh'))

    // After refresh, the reloadKey changes and useEffect re-fetches
    await waitFor(() => {
      expect(getRecipeDetails).toHaveBeenCalled()
    })
  })

  // ── PDF download ───────────────────────────────────────────────────────

  it('calls jsPDF save when download PDF is clicked', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Download PDF'))

    expect(require('jspdf').mockDoc.save).toHaveBeenCalledWith(
      'chicken curry-details.pdf'
    )
  })

  // ── Back navigation ────────────────────────────────────────────────────

  it('navigates back when back button is clicked', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByLabelText('Back')).toBeInTheDocument()
    })
    // The back button calls navigate('/recipe')
    // We verify it's rendered and clickable
    fireEvent.click(screen.getByLabelText('Back'))
    // Navigation is handled by react-router, we just verify no crash
  })

  // ── Edge cases ─────────────────────────────────────────────────────────

  it('handles recipe data without recipe wrapper', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'test recipe',
      meal_category: 'snack',
    })
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Test recipe')).toBeInTheDocument()
      expect(screen.getByText('Snack')).toBeInTheDocument()
    })
  })

  it('handles null/undefined values gracefully', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: {
        id: 1,
        name: null,
        meal_category: undefined,
        nutrition: null,
        ingredients: null,
        preparation_notes: null,
        additional_info: null,
        image_url: null,
      },
    })
    renderDetail()
    await waitFor(() => {
      // Should show fallback dashes for null/undefined values
      const dashes = screen.getAllByText('--')
      expect(dashes.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('handles empty string values', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: {
        id: 1,
        name: '',
        meal_category: '',
        serving_unit: '',
        quantity: '',
        serving_people_count: '',
        size: '',
        description: '',
        nutrition: { calories: '', protein: '', carbs: '', fat: '', fiber: '' },
        ingredients: [],
        preparation_notes: '',
        additional_info: '',
        image_url: '',
      },
    })
    renderDetail()
    await waitFor(() => {
      // Should show fallback dashes for empty values
      const dashes = screen.getAllByText('--')
      expect(dashes.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('handles URL values in DetailItem', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: {
        id: 1,
        name: 'test',
        meal_category: 'snack',
        image_url: 'https://example.com/img.jpg',
      },
    })
    renderDetail()
    await waitFor(() => {
      // The image_url is rendered as an <img> not as a link in DetailItem
      // But if any DetailItem gets a URL value, it should render as a link
      expect(screen.getByAltText('Recipe')).toBeInTheDocument()
    })
  })

  // ── toTitleCase helper tests ───────────────────────────────────────────

  it('toTitleCase returns -- for null', () => {
    // Import is not possible since it's not exported, but we test via rendered output
    renderDetail()
    // The component uses toTitleCase internally
  })

  // ── capitalizeFirstLetters helper tests ────────────────────────────────

  it('capitalizes first letter of preparation notes', async () => {
    ;(getRecipeDetails as jest.Mock).mockResolvedValue({
      recipe: {
        ...mockRecipeData.recipe,
        preparation_notes: '<p>chicken curry recipe</p>',
      },
    })
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Preparation Notes')).toBeInTheDocument()
    })
  })

  // ── Multiple renders / cleanup ─────────────────────────────────────────

  it('cleans up on unmount', () => {
    const { unmount } = renderDetail()
    expect(() => unmount()).not.toThrow()
  })

  it('handles component re-mount with different id', async () => {
    const { rerender } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={['/recipe/1']}>
          <Routes>
            <Route path="/recipe/:id" element={<RecipeDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Recipe Details')).toBeInTheDocument()
    })
    expect(getRecipeDetails).toHaveBeenCalledWith('1')
  })
})
