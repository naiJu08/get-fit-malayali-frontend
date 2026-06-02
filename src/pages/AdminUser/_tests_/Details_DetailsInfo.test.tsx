import { render } from '@testing-library/react';
import DetailsInfo from '../Details/DetailsInfo';
describe('DetailsInfo Component', () => {
  it('renders without crashing', () => {
    render(<DetailsInfo />);
  });
});
