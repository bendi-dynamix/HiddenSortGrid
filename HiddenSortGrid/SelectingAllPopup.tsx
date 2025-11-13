import * as React from "react";
import {
    Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
    Button, ProgressBar
} from "@fluentui/react-components";

export interface SelectingAllPopupProps {
    onCancel: () => void;
};

export const SelectingAllPopup: React.FC<SelectingAllPopupProps> = ({
    onCancel
}) => {
    return (
        <Dialog
            open={true}
            modalType="modal">
            <DialogSurface style={{ position: "fixed" }}>
                <DialogBody>
                    <DialogTitle>Selecting rows</DialogTitle>
                    <DialogContent>
                        We&apos;re working on selecting more rows for you.
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={onCancel}>Cancel</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}