/**
 * /superadmin/reports → redirect to /admin/reports
 * Super admins can use the same reports queue as admins.
 */
import { redirect } from 'next/navigation'

export default function SuperAdminReportsPage() {
    redirect('/admin/reports')
}
