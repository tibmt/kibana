/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component, Fragment } from 'react';

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  // @ts-ignore
  EuiInMemoryTable,
  EuiLink,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage, injectI18n } from '@kbn/i18n/react';
// @ts-ignore
import { toastNotifications } from 'ui/notify';

import { SpacesNavState } from 'plugins/spaces/views/nav_control';
import { UserProfile } from '../../../../../xpack_main/public/services/user_profile';
import { isReservedSpace } from '../../../../common';
import { Space } from '../../../../common/model/space';
import { SpaceAvatar } from '../../../components';
import { SpacesManager } from '../../../lib/spaces_manager';
import { ConfirmDeleteModal } from '../components/confirm_delete_modal';
import { SecureSpaceMessage } from '../components/secure_space_message';
import { UnauthorizedPrompt } from '../components/unauthorized_prompt';

interface Props {
  spacesManager: SpacesManager;
  spacesNavState: SpacesNavState;
  userProfile: UserProfile;
}

interface State {
  spaces: Space[];
  loading: boolean;
  showConfirmDeleteModal: boolean;
  selectedSpace: Space | null;
  error: Error | null;
}

export class SpacesGridPageUI extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      spaces: [],
      loading: true,
      showConfirmDeleteModal: false,
      selectedSpace: null,
      error: null,
    };
  }

  public componentDidMount() {
    this.loadGrid();
  }

  public render() {
    return (
      <EuiPage restrictWidth className="spacesGridPage">
        <EuiPageBody>
          <EuiPageContent horizontalPosition="center">{this.getPageContent()}</EuiPageContent>
          <SecureSpaceMessage userProfile={this.props.userProfile} />
        </EuiPageBody>
        {this.getConfirmDeleteModal()}
      </EuiPage>
    );
  }

  public getPageContent() {
    const { intl } = this.props;
    if (!this.props.userProfile.hasCapability('manageSpaces')) {
      return <UnauthorizedPrompt />;
    }

    return (
      <Fragment>
        <EuiFlexGroup justifyContent={'spaceBetween'}>
          <EuiFlexItem grow={false}>
            <EuiText>
              <h1>
                <FormattedMessage
                  id="xpack.spaces.view.management.spacesGrid.spacesGridPage.spacesTitle"
                  defaultMessage="Spaces"
                />
              </h1>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{this.getPrimaryActionButton()}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size={'xl'} />

        <EuiInMemoryTable
          itemId={'id'}
          items={this.state.spaces}
          columns={this.getColumnConfig()}
          hasActions
          pagination={true}
          search={{
            box: {
              placeholder: intl.formatMessage({
                id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.searchPlaceHolder',
                defaultMessage: 'Search',
              }),
            },
          }}
          loading={this.state.loading}
          message={
            this.state.loading ? (
              <FormattedMessage
                id="xpack.spaces.view.management.spacesGrid.spacesGridPage.loadingTitle"
                defaultMessage="loading…"
              />
            ) : (
              undefined
            )
          }
        />
      </Fragment>
    );
  }

  public getPrimaryActionButton() {
    return (
      <EuiButton
        fill
        onClick={() => {
          window.location.hash = `#/management/spaces/create`;
        }}
      >
        <FormattedMessage
          id="xpack.spaces.view.management.spacesGrid.spacesGridPage.createSpaceButton"
          defaultMessage="Create space"
        />
      </EuiButton>
    );
  }

  public getConfirmDeleteModal = () => {
    if (!this.state.showConfirmDeleteModal || !this.state.selectedSpace) {
      return null;
    }

    const { spacesNavState, spacesManager } = this.props;

    return (
      <ConfirmDeleteModal
        space={this.state.selectedSpace}
        spacesNavState={spacesNavState}
        spacesManager={spacesManager}
        onCancel={() => {
          this.setState({
            showConfirmDeleteModal: false,
          });
        }}
        onConfirm={this.deleteSpace}
      />
    );
  };

  public deleteSpace = async () => {
    const { intl } = this.props;
    const { spacesManager, spacesNavState } = this.props;

    const space = this.state.selectedSpace;

    if (!space) {
      return;
    }

    try {
      await spacesManager.deleteSpace(space);
    } catch (error) {
      const { message: errorMessage = '' } = error.data || {};

      toastNotifications.addDanger(
        intl.formatMessage(
          {
            id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.errorDeletingSpaceTitle',
            defaultMessage: 'Error deleting space: {errorMessage}',
          },
          {
            errorMessage,
          }
        )
      );
    }

    this.setState({
      showConfirmDeleteModal: false,
    });

    this.loadGrid();

    const message = intl.formatMessage(
      {
        id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.deletingSpaceTitle',
        defaultMessage: 'Deleted "{spaceName}" space.',
      },
      {
        spaceName: space.name,
      }
    );

    toastNotifications.addSuccess(message);

    spacesNavState.refreshSpacesList();
  };

  public loadGrid = () => {
    const { spacesManager } = this.props;

    this.setState({
      loading: true,
      spaces: [],
    });

    const setSpaces = (spaces: Space[]) => {
      this.setState({
        loading: false,
        spaces,
      });
    };

    spacesManager
      .getSpaces()
      .then(spaces => {
        setSpaces(spaces);
      })
      .catch(error => {
        this.setState({
          loading: false,
          error,
        });
      });
  };

  public getColumnConfig() {
    const { intl } = this.props;
    return [
      {
        field: 'name',
        name: '',
        width: '50px',
        sortable: true,
        render: (value: string, record: Space) => {
          return (
            <EuiLink
              onClick={() => {
                this.onEditSpaceClick(record);
              }}
            >
              <SpaceAvatar space={record} size="s" />
            </EuiLink>
          );
        },
      },
      {
        field: 'name',
        name: intl.formatMessage({
          id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.spaceColumnNameTitle',
          defaultMessage: 'Space',
        }),
        sortable: true,
        render: (value: string, record: Space) => {
          return (
            <EuiLink
              onClick={() => {
                this.onEditSpaceClick(record);
              }}
            >
              {value}
            </EuiLink>
          );
        },
      },
      {
        field: 'id',
        name: intl.formatMessage({
          id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.identifierColumnNameTitle',
          defaultMessage: 'Identifier',
        }),
        sortable: true,
      },
      {
        field: 'description',
        name: intl.formatMessage({
          id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.descriptionColumnNameTitle',
          defaultMessage: 'Description',
        }),
        sortable: true,
      },
      {
        name: intl.formatMessage({
          id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.ActionsColumnNameTitle',
          defaultMessage: 'Actions',
        }),
        actions: [
          {
            name: intl.formatMessage({
              id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.editNameTitle',
              defaultMessage: 'Edit',
            }),
            description: intl.formatMessage({
              id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.editSpaceTitle',
              defaultMessage: 'Edit this space.',
            }),
            onClick: this.onEditSpaceClick,
            type: 'icon',
            icon: 'pencil',
            color: 'primary',
          },
          {
            available: (record: Space) => !isReservedSpace(record),
            name: intl.formatMessage({
              id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.deleteNameTitle',
              defaultMessage: 'Delete',
            }),
            description: intl.formatMessage({
              id: 'xpack.spaces.view.management.spacesGrid.spacesGridPage.deleteThisSpaceTitle',
              defaultMessage: 'Delete this space.',
            }),
            onClick: this.onDeleteSpaceClick,
            type: 'icon',
            icon: 'trash',
            color: 'danger',
          },
        ],
      },
    ];
  }

  private onEditSpaceClick = (space: Space) => {
    window.location.hash = `#/management/spaces/edit/${encodeURIComponent(space.id)}`;
  };

  private onDeleteSpaceClick = (space: Space) => {
    this.setState({
      selectedSpace: space,
      showConfirmDeleteModal: true,
    });
  };
}

export const SpacesGridPage = injectI18n(SpacesGridPageUI);
