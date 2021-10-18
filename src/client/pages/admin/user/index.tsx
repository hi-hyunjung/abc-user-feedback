/* */
import React, { useState } from 'react'

/* */
import styles from './styles.module.scss'
import { AdminPageContainer, UserListContainer } from '~/containers'
import { Button, InviteUserModal } from '~/components'
import { useApp } from '~/hooks'

const AdminUserPage = () => {
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false)

  const { config } = useApp()

  const handleShowInviteUserModal = () => {
    setShowInviteModal(true)
  }

  const handleCloseInviteModal = () => {
    setShowInviteModal(false)
  }

  return (
    <AdminPageContainer title='Users'>
      <div className={styles.invite}>
        <div className={styles.invite__title}>
          <h3>Roles</h3>
          <Button
            onClick={handleShowInviteUserModal}
            disabled={!config.email.enable}
          >
            Invite by email
            {!config.email.enable && ' (check smtp setting)'}
          </Button>
        </div>
        <div className={styles.role}>
          <span className={styles.role__description}>
            The level of access depends on the role
          </span>
          <ul className={styles.role__block}>
            <li>
              <b>Owner</b> has all privilege about service
            </li>
            <li>
              <b>Admin</b> is admin but cannot setting service
            </li>
            <li>
              <b>User</b> is default member use this service. user can response
              to feedback and sharing or comment post
            </li>
          </ul>
        </div>
      </div>
      <UserListContainer />
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={handleCloseInviteModal}
      />
    </AdminPageContainer>
  )
}

export default AdminUserPage