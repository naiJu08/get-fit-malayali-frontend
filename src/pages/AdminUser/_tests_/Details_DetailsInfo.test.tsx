import { render } from '@testing-library/react'
import DetailsInfo from '../Details/DetailsInfo'
describe('DetailsInfo Component', () => {
  it('renders without crashing', () => {
    render(
      <DetailsInfo
        user={{ id: 1, gender: '0', date_of_birth: '2000-01-01', status: '0' }}
        loading={false}
        error=""
        isNutritionist={false}
      />
    )
  })
})
