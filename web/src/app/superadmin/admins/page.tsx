/**
 * /superadmin/admins → redirect to /superadmin/promote
 */
import { redirect } from 'next/navigation'

export default function SuperAdminAdminsPage() {
    redirect('/superadmin/promote')
}
