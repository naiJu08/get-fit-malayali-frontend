import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import RecipeDetail from './Detail'

const mockNavigate = jest.fn()
let mockGetRecipeDetails = jest.fn()

jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as Record<string, unknown>),
  useParams: () => ({ id: '123' }),
  useNavigate: () => mockNavigate,
}))

jest.mock('./api', () => ({
  getRecipeDetails: (...args: any[]) => mockGetRecipeDetails(...args),
}))

jest.mock('../../components/common/icons', () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />,
}))

jest.mock('../../components/app/alertBox/infoBox', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => (
    <div data-testid="info-box">{content}</div>
  ),
}))

describe('RecipeDetail page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetRecipeDetails = jest.fn()
  })

  it('shows loading state initially', async () => {
    mockGetRecipeDetails.mockResolvedValueOnce({ recipe: {} })

    render(<RecipeDetail />)

    expect(screen.getByTestId('info-box')).toHaveTextContent(
      'Loading recipe details...'
    )

    await waitFor(() =>
      expect(mockGetRecipeDetails).toHaveBeenCalledWith('123')
    )
  })

  it('renders recipe data when fetch succeeds', async () => {
    mockGetRecipeDetails.mockResolvedValueOnce({
      recipe: {
        name: 'Power Salad',
        description: 'Fresh and tasty',
        meal_category: 'Lunch',
        serving_unit: 'Bowl',
        nutrition: { calories: 400, protein: 10, carbs: 20, fat: 5, fiber: 2 },
        ingredients: [{ id: 1, name: 'Lettuce', quantity: 1, unit: 'cup' }],
        image_url: 'https://example.com/img.jpg',
      },
    })

    render(<RecipeDetail />)

    await waitFor(() =>
      expect(screen.getByText('Power Salad')).toBeInTheDocument()
    )

    expect(screen.getByText('Fresh and tasty')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('Bowl')).toBeInTheDocument()

    const proteinRow = screen.getByText(/Protein:/i).parentElement
    const carbsRow = screen.getByText(/Carbs:/i).parentElement
    const fatRow = screen.getByText(/Fat:/i).parentElement
    const fiberRow = screen.getByText(/Fiber:/i).parentElement

    expect(proteinRow).toHaveTextContent('Protein: 10')
    expect(carbsRow).toHaveTextContent('Carbs: 20')
    expect(fatRow).toHaveTextContent('Fat: 5')
    expect(fiberRow).toHaveTextContent('Fiber: 2')

    expect(screen.getByText('Lettuce')).toBeInTheDocument()
    expect(screen.getAllByText('1')[0]).toBeInTheDocument()
    expect(screen.getByText('cup')).toBeInTheDocument()
  })

  it('shows error when fetch fails', async () => {
    mockGetRecipeDetails.mockRejectedValueOnce({
      response: { data: { message: 'Failed to load recipe' } },
    })

    render(<RecipeDetail />)

    await waitFor(() =>
      expect(screen.getByTestId('info-box')).toHaveTextContent(
        'Failed to load recipe'
      )
    )
  })

  it('navigates back to listing when back button clicked', async () => {
    mockGetRecipeDetails.mockResolvedValueOnce({ recipe: {} })
    render(<RecipeDetail />)

    await waitFor(() =>
      expect(mockGetRecipeDetails).toHaveBeenCalledWith('123')
    )

    fireEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/recipe')
  })
})
