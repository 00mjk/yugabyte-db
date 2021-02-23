// Copyright (c) YugaByte, Inc.

import React, {Component, useState} from 'react';
import { Row, Col, Alert } from 'react-bootstrap';
import { YBButton } from '../../../common/forms/fields';
import { withRouter } from 'react-router';
import { isValidObject } from '../../../../utils/ObjectUtils';
import { getPromiseState } from '../../../../utils/PromiseUtils';
import { YBConfirmModal } from '../../../modals';
import { RegionMap, YBMapLegend } from '../../../maps';
import {useComponentDidUpdate} from "../../../../hooks/useComponentDidUpdate";

const PROVIDER_TYPE = 'docker';

export const DockerProviderConfiguration = withRouter((
  {
    handleSubmit,
    submitting,
    dockerBootstrap: { loading, error },
    configuredProviders,
    configuredRegions,
    universeList,
    createProvider,
    deleteProviderConfig,
    cloudBootstrap,
    dockerBootstrap,
    reloadCloudMetadata,
    showDeleteProviderModal,
    hideDeleteProviderModal,
    visibleModal
  }
) => {
  const [prevDockerBootstrap, setPrevDockerBootstrap] = useState(dockerBootstrap);
  const [prevCloudBootstrap, setPrevCloudBootstrap] = useState(cloudBootstrap);
  const createProviderConfig = () => {
    createProvider();
  };

  const deleteProviderConfigLocal = () => {
    const dockerProvider = configuredProviders.data.find(
      (provider) => provider.code === PROVIDER_TYPE
    );
    deleteProviderConfig(dockerProvider.uuid);
  };

  useComponentDidUpdate(() => {

    // Reload Metadata for Provider Create
    if (
      getPromiseState(dockerBootstrap).isSuccess() &&
      getPromiseState(prevDockerBootstrap).isLoading()
    ) {
      setPrevDockerBootstrap(dockerBootstrap)
      reloadCloudMetadata();
    }
    // Reload Metadata For Provider Delete
    if (
      cloudBootstrap.promiseState !== prevCloudBootstrap &&
      cloudBootstrap.data.type === 'cleanup'
    ) {
      setPrevCloudBootstrap(cloudBootstrap);
      reloadCloudMetadata();
    }
  }, [dockerBootstrap, cloudBootstrap]);


  const dockerProvider = configuredProviders.data.find(
    (provider) => provider.code === PROVIDER_TYPE
  );
  const dockerRegions = configuredRegions.data.filter(
    (configuredRegion) => configuredRegion.provider.code === PROVIDER_TYPE
  );
  if (isValidObject(dockerProvider)) {
    let universeExistsForProvider = false;
    if (
      getPromiseState(configuredProviders).isSuccess() &&
      getPromiseState(universeList).isSuccess()
    ) {
      universeExistsForProvider = universeList.data.some(
        (universe) => universe.provider && universe.provider.uuid === dockerProvider.uuid
      );
    }
    const deleteButtonDisabled = submitting || universeExistsForProvider;
    let deleteButtonClassName = 'btn btn-default manage-provider-btn';
    let deleteButtonTitle = 'Delete this configuration.';
    if (deleteButtonDisabled) {
      deleteButtonTitle = 'Delete all Docker based universes before deleting the configuration.';
    } else {
      deleteButtonClassName += ' delete-btn';
    }

    return (
      <div className="provider-config-container">
        <Row className="config-section-header">
          <Col md={12}>
            <span className="pull-right" title={deleteButtonTitle}>
              <YBButton
                btnText="Delete Configuration"
                disabled={deleteButtonDisabled}
                btnClass={deleteButtonClassName}
                onClick={showDeleteProviderModal}
              />
              <YBConfirmModal
                name="delete-docker-provider"
                title={'Confirm Delete'}
                onConfirm={handleSubmit(deleteProviderConfig)}
                currentModal="deleteDockerProvider"
                visibleModal={visibleModal}
                hideConfirmModal={hideDeleteProviderModal}
              >
                Are you sure you want to delete this Docker configuration?
              </YBConfirmModal>
            </span>
            <p>
              <strong>Name:</strong> Docker
            </p>
            <p>
              Setup&nbsp;
              <a href="https://docs.docker.com/" target="_blank" rel="noopener noreferrer">
                Docker Platform
              </a>
              &nbsp;in order to create YugaByte clusters as containers running on your host
              machine.
            </p>
          </Col>
        </Row>
        <Row>
          <Col lg={12} className="provider-map-container">
            <RegionMap
              title="All Supported Regions"
              regions={dockerRegions}
              type="Region"
              showLabels={true}
            />
            <YBMapLegend title="Region Map" />
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="provider-config-container">
      <form name="dockerConfigForm" onSubmit={handleSubmit(createProviderConfig)}>
        <Row className="config-section-header">
          <Col lg={12}>
            {error && <Alert bsStyle="danger">{error}</Alert>}
            <div className="docker-config-form form-right-aligned-labels">
              Setup
              <a href="https://docs.docker.com/" target="_blank" rel="noopener noreferrer">
                Docker Platform
              </a>
              &nbsp; in order to create YugaByte clusters as containers running on your host
              machine.
            </div>
          </Col>
        </Row>
        <div className="form-action-button-container">
          <YBButton
            btnText={'Setup'}
            btnClass={'btn btn-default save-btn'}
            disabled={submitting || loading}
            btnType="submit"
          />
        </div>
      </form>
    </div>
  );
})
