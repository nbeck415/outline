import { observer } from "mobx-react";
import { NewDocumentIcon } from "outline-icons";
import * as React from "react";
import Dropzone from "react-dropzone";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Flex from "~/components/Flex";
import LoadingIndicator from "~/components/LoadingIndicator";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import { uploadFile } from "~/utils/files";

type Props = {
  children: JSX.Element;
  format?: string;
  disabled?: boolean;
  activeClassName?: string;
  onSubmit: () => void;
};

function DropToImport({ disabled, onSubmit, children, format }: Props) {
  const { t } = useTranslation();
  const { collections } = useStores();
  const { showToast } = useToasts();
  const [isImporting, setImporting] = React.useState(false);

  const handleFiles = React.useCallback(
    async (files) => {
      if (files.length > 1) {
        showToast(t("Please choose a single file to import"), {
          type: "error",
        });
        return;
      }
      const file = files[0];

      setImporting(true);

      try {
        const attachment = await uploadFile(file, {
          name: file.name,
        });
        await collections.import(attachment.id, format);
        onSubmit();
        showToast(
          t("Your import is being processed, you can safely leave this page"),
          {
            type: "success",
            timeout: 6000,
          }
        );
      } catch (err) {
        showToast(err.message);
      } finally {
        setImporting(false);
      }
    },
    [t, onSubmit, collections, format, showToast]
  );

  const handleRejection = React.useCallback(() => {
    showToast(t("File not supported – please upload a valid ZIP file"), {
      type: "error",
    });
  }, [t, showToast]);

  if (disabled) {
    return children;
  }

  return (
    <>
      {isImporting && <LoadingIndicator />}
      <Dropzone
        accept="application/zip, application/x-zip-compressed"
        onDropAccepted={handleFiles}
        onDropRejected={handleRejection}
        disabled={isImporting}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <DropzoneContainer
            {...getRootProps()}
            $disabled={isImporting}
            $isDragActive={isDragActive}
            tabIndex={-1}
          >
            <input {...getInputProps()} />
            <Flex align="center" gap={4} column>
              <Icon size={32} color="#fff" />
              {children}
            </Flex>
          </DropzoneContainer>
        )}
      </Dropzone>
    </>
  );
}

const Icon = styled(NewDocumentIcon)`
  padding: 4px;
  border-radius: 50%;
  background: ${(props) => props.theme.brand.blue};
  color: white;
`;

const DropzoneContainer = styled.div<{
  $disabled: boolean;
  $isDragActive: boolean;
}>`
  background: ${(props) =>
    props.$isDragActive
      ? props.theme.secondaryBackground
      : props.theme.background};
  border-radius: 8px;
  border: 1px dashed ${(props) => props.theme.divider};
  padding: 52px;
  text-align: center;
  font-size: 15px;
  cursor: pointer;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  &:hover {
    background: ${(props) => props.theme.secondaryBackground};
  }
`;

export default observer(DropToImport);
