/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { I18nProvider, InjectedIntl, injectI18n } from '@kbn/i18n/react';
import React, { Component } from 'react';
import { Space } from '../../../../../../../../spaces/common/model/space';
import { UserProfile } from '../../../../../../../../xpack_main/public/services/user_profile';
import { KibanaPrivilege } from '../../../../../../../common/model/kibana_privilege';
import { Role } from '../../../../../../../common/model/role';
import { RoleValidator } from '../../../lib/validate_role';
import { CollapsiblePanel } from '../../collapsible_panel';
import { SimplePrivilegeForm } from './simple_privilege_form';
import { SpaceAwarePrivilegeForm } from './space_aware_privilege_form';

interface Props {
  role: Role;
  spacesEnabled: boolean;
  spaces?: Space[];
  userProfile: UserProfile;
  editable: boolean;
  kibanaAppPrivileges: KibanaPrivilege[];
  onChange: (role: Role) => void;
  validator: RoleValidator;
  intl: InjectedIntl;
}

class KibanaPrivilegesUI extends Component<Props, {}> {
  public render() {
    const { intl } = this.props;
    return (
      <I18nProvider>
        <CollapsiblePanel
          iconType={'logoKibana'}
          title={intl.formatMessage({
            id: 'xpack.security.management.editRoles.kibanaPrivileges.kibanaTitle',
            defaultMessage: 'Kibana',
          })}
        >
          {this.getForm()}
        </CollapsiblePanel>
      </I18nProvider>
    );
  }

  public getForm = () => {
    const {
      kibanaAppPrivileges,
      role,
      spacesEnabled,
      spaces = [],
      userProfile,
      onChange,
      editable,
      validator,
    } = this.props;

    if (spacesEnabled) {
      return (
        <SpaceAwarePrivilegeForm
          kibanaAppPrivileges={kibanaAppPrivileges}
          role={role}
          spaces={spaces}
          userProfile={userProfile}
          onChange={onChange}
          editable={editable}
          validator={validator}
        />
      );
    } else {
      return (
        <SimplePrivilegeForm
          kibanaAppPrivileges={kibanaAppPrivileges}
          role={role}
          onChange={onChange}
          editable={editable}
        />
      );
    }
  };
}

export const KibanaPrivileges = injectI18n(KibanaPrivilegesUI);
