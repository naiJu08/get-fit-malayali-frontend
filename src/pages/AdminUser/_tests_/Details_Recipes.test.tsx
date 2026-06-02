import { render } from '@testing-library/react';
import Recipes from '../Details/Recipes';
describe('Recipes Component', () => {
  it('renders without crashing', () => {
    render(<Recipes />);
  });
});
