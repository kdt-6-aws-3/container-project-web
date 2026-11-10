import { createBrowserRouter } from 'react-router'
import { RootLayout } from '@/layout/components/RootLayout'
import { HomePage } from '@/features/home/HomePage'
import { OwnersPage } from '@/features/owners/OwnersPage'
import { OwnerDetailPage } from '@/features/owners/OwnerDetailPage'
import { OwnerFormPage } from '@/features/owners/OwnerFormPage'
import { PetFormPage } from '@/features/pets/PetFormPage'
import { VisitFormPage } from '@/features/visits/VisitFormPage'
import { VetsPage } from '@/features/vets/VetsPage'
import { AppointmentsPage } from '@/features/appointments/AppointmentsPage'
import { AppointmentDetailPage } from '@/features/appointments/AppointmentDetailPage'
import { AppointmentFormPage } from '@/features/appointments/AppointmentFormPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'owners', element: <OwnersPage /> },
      { path: 'owners/new', element: <OwnerFormPage /> },
      { path: 'owners/:ownerId', element: <OwnerDetailPage /> },
      { path: 'owners/:ownerId/edit', element: <OwnerFormPage /> },
      { path: 'owners/:ownerId/pets/new', element: <PetFormPage /> },
      { path: 'owners/:ownerId/pets/:petId/edit', element: <PetFormPage /> },
      { path: 'owners/:ownerId/pets/:petId/visits/new', element: <VisitFormPage /> },
      { path: 'owners/:ownerId/pets/:petId/visits/:visitId/edit', element: <VisitFormPage /> },
      { path: 'vets', element: <VetsPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'appointments/new', element: <AppointmentFormPage /> },
      { path: 'appointments/:appointmentId', element: <AppointmentDetailPage /> },
      { path: 'appointments/:appointmentId/edit', element: <AppointmentFormPage /> },
    ],
  },
])
