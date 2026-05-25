// // import React from 'react'
// // import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// // import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// // jest.mock('../../../components/app/formBuilder/index', () => () => (
// //   <div data-testid="form-builder">form</div>
// // ))

// // jest.mock('../../../components/common/drawer', () => (props: any) => (
// //   <div data-testid="custom-drawer">{props.children}</div>
// // ))

// // jest.mock(
// //   '../../../components/common/drawer/customeSideViewer',
// //   () => (props: any) => (
// //     <div data-testid="side-viewer">{JSON.stringify(props.headerData)}</div>
// //   )
// // )

// // jest.mock('../api', () => ({
// //   useAssessor: () => ({
// //     data: {
// //       user: { first_name: 'John', last_name: 'Doe', username: 'a@b.com' },
// //       contact_number: '123',
// //     },
// //     refetch: jest.fn(),
// //   }),
// //   useEditMyProfile: (cb: any) => ({ mutate: jest.fn(), isLoading: false }),
// //   updateProfileAttachment: jest.fn(() => Promise.resolve({ message: 'ok' })),
// // }))

// // jest.mock('../../../store/filterSore/assessorStore', () => ({
// //   useAssessorFilterStore: () => ({
// //     pageParams: {
// //       page: 1,
// //       page_size: 10,
// //       search: '',
// //       ordering: '',
// //       filters: {},
// //     },
// //   }),
// // }))

// // jest.mock('../../../store/domainManageStore', () => ({
// //   useDomainManageStore: () => ({ domainType: 'Assessor' }),
// // }))

// // jest.mock('../../../components/common/snackbar', () => ({
// //   useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
// // }))

// // const mockIsValidFile = jest.fn(() => true)
// // jest.mock('../../../utilities/commonUtilities', () => ({
// //   isValidFile: (...args: any[]) => mockIsValidFile(...args),
// // }))

// // // Prevent importing full route config which expects runtime store values
// // jest.mock('../../../configs/route.config', () => ({}))

// // import MyProfileDrawer from '../myProfile'

// // function renderWithQueryClient(ui: React.ReactElement) {
// //   const queryClient = new QueryClient({
// //     defaultOptions: {
// //       queries: { retry: false },
// //       mutations: { retry: false },
// //     },
// //     logger: {
// //       log: () => {},
// //       warn: () => {},
// //       error: () => {},
// //     },
// //   })

// //   return render(
// //     <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
// //   )
// // }

// // describe('MyProfileDrawer', () => {
// //   it('renders side viewer in view mode', () => {
// //     renderWithQueryClient(
// //       <MyProfileDrawer
// //         isDrawerOpen={true}
// //         handleClose={() => {}}
// //         viewMode={true}
// //       />
// //     )

// //     expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
// //     expect(screen.getByTestId('custom-drawer')).toBeInTheDocument()
// //   })

// //   it('renders form builder in edit mode and handles file change invalid', async () => {
// //     mockIsValidFile.mockReturnValueOnce(false)

// //     const { getByTestId } = renderWithQueryClient(
// //       <MyProfileDrawer
// //         isDrawerOpen={true}
// //         handleClose={() => {}}
// //         edit={true}
// //         setEdit={() => {}}
// //         setViewMode={() => {}}
// //       />
// //     )

// //     const input = screen.getByLabelText('', { selector: 'input[type=file]' })
// //     // create a fake file
// //     const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' })

// //     // fire change event
// //     fireEvent.change(input, { target: { files: [file] } })

// //     await waitFor(() => {
// //       // enqueueSnackbar was mocked; ensure component didn't crash
// //       expect(getByTestId('form-builder')).toBeInTheDocument()
// //     })
// //   })
// // })

// import React from 'react'
// import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// jest.mock('../../../components/app/formBuilder/index', () => () => (
//   <div data-testid="form-builder">form</div>
// ))

// jest.mock('../../../components/common/drawer', () => (props: any) => (
//   <div data-testid="custom-drawer">{props.children}</div>
// ))

// jest.mock(
//   '../../../components/common/drawer/customeSideViewer',
//   () => (props: any) => (
//     <div data-testid="side-viewer">{JSON.stringify(props.headerData)}</div>
//   )
// )

// jest.mock('../api', () => ({
//   useAssessor: () => ({
//     data: {
//       user: { first_name: 'John', last_name: 'Doe', username: 'a@b.com' },
//       contact_number: '123',
//     },
//     refetch: jest.fn(),
//   }),
//   useEditMyProfile: (cb: any) => ({ mutate: jest.fn(), isLoading: false }),
//   updateProfileAttachment: jest.fn(() => Promise.resolve({ message: 'ok' })),
// }))

// jest.mock('../../../store/filterSore/assessorStore', () => ({
//   useAssessorFilterStore: () => ({
//     pageParams: {
//       page: 1,
//       page_size: 10,
//       search: '',
//       ordering: '',
//       filters: {},
//     },
//   }),
// }))

// jest.mock('../../../store/domainManageStore', () => ({
//   useDomainManageStore: () => ({ domainType: 'Assessor' }),
// }))

// jest.mock('../../../components/common/snackbar', () => ({
//   useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
// }))

// const mockIsValidFile = jest.fn(() => true)
// jest.mock('../../../utilities/commonUtilities', () => ({
//   isValidFile: (...args: any[]) => mockIsValidFile(...args),
// }))

// // Prevent importing full route config which expects runtime store values
// jest.mock('../../../configs/route.config', () => ({}))

// import MyProfileDrawer from '../myProfile'

// function renderWithQueryClient(ui: React.ReactElement) {
//   const queryClient = new QueryClient({
//     defaultOptions: {
//       queries: { retry: false },
//       mutations: { retry: false },
//     },
//     logger: {
//       log: () => {},
//       warn: () => {},
//       error: () => {},
//     },
//   })

//   return render(
//     <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
//   )
// }

// describe('MyProfileDrawer', () => {
//   it('renders side viewer in view mode', () => {
//     renderWithQueryClient(
//       <MyProfileDrawer
//         isDrawerOpen={true}
//         handleClose={() => {}}
//         viewMode={true}
//       />
//     )

//     expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
//     expect(screen.getByTestId('custom-drawer')).toBeInTheDocument()
//   })

//   it('renders form builder in edit mode and handles file change invalid', async () => {
//     mockIsValidFile.mockReturnValueOnce(false)

//     renderWithQueryClient(
//       <MyProfileDrawer
//         isDrawerOpen={true}
//         handleClose={() => {}}
//         edit={true}
//         setEdit={() => {}}
//         setViewMode={() => {}}
//       />
//     )

//     // Use getAllByLabelText or getByLabelText with a more specific selector
//     const input = screen.getByLabelText('', { selector: 'input[type=file]' })
    
//     // Create a fake file
//     const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' })

//     // Fire change event
//     fireEvent.change(input, { target: { files: [file] } })

//     await waitFor(() => {
//       // Verify form builder is still rendered
//       expect(screen.getByTestId('form-builder')).toBeInTheDocument()
//     })
    
//     // Reset mock for other tests
//     mockIsValidFile.mockReset()
//     mockIsValidFile.mockReturnValue(true)
//   })
// })


import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('../../../components/app/formBuilder/index', () => () => (
  <div data-testid="form-builder">form</div>
))

jest.mock('../../../components/common/drawer', () => (props: any) => (
  <div data-testid="custom-drawer">{props.children}</div>
))

jest.mock(
  '../../../components/common/drawer/customeSideViewer',
  () => (props: any) => (
    <div data-testid="side-viewer">{JSON.stringify(props.headerData)}</div>
  )
)

jest.mock('../api', () => ({
  useAssessor: () => ({
    data: {
      user: { first_name: 'John', last_name: 'Doe', username: 'a@b.com' },
      contact_number: '123',
    },
    refetch: jest.fn(),
  }),
  useEditMyProfile: (cb: any) => ({ mutate: jest.fn(), isLoading: false }),
  updateProfileAttachment: jest.fn(() => Promise.resolve({ message: 'ok' })),
}))

jest.mock('../../../store/filterSore/assessorStore', () => ({
  useAssessorFilterStore: () => ({
    pageParams: {
      page: 1,
      page_size: 10,
      search: '',
      ordering: '',
      filters: {},
    },
  }),
}))

jest.mock('../../../store/domainManageStore', () => ({
  useDomainManageStore: () => ({ domainType: 'Assessor' }),
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: jest.fn() }),
}))

const mockIsValidFile = jest.fn(() => true)
jest.mock('../../../utilities/commonUtilities', () => ({
  isValidFile: (...args: any[]) => mockIsValidFile.apply(null, args),
}))// Prevent importing full route config which expects runtime store values
jest.mock('../../../configs/route.config', () => ({}))

import MyProfileDrawer from '../myProfile'

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('MyProfileDrawer', () => {
  it('renders side viewer in view mode', () => {
    renderWithQueryClient(
      <MyProfileDrawer
        isDrawerOpen={true}
        handleClose={() => {}}
        viewMode={true}
      />
    )

    expect(screen.getByTestId('side-viewer')).toBeInTheDocument()
    expect(screen.getByTestId('custom-drawer')).toBeInTheDocument()
  })

  it('renders form builder in edit mode and handles file change invalid', async () => {
    mockIsValidFile.mockReturnValueOnce(false)

    renderWithQueryClient(
      <MyProfileDrawer
        isDrawerOpen={true}
        handleClose={() => {}}
        edit={true}
        setEdit={() => {}}
        setViewMode={() => {}}
      />
    )

    const input = screen.getByLabelText('', { selector: 'input[type=file]' })
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('form-builder')).toBeInTheDocument()
    })
    
    mockIsValidFile.mockReset()
    mockIsValidFile.mockReturnValue(true)
  })
})