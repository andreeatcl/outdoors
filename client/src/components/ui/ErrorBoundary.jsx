import { Component } from "react";
import Modal from "./Modal";
import Button from "./Button";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  handleClose = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <Modal
          open
          onClose={this.handleClose}
          title="A apărut o eroare"
          size="sm"
        >
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Ceva nu a mers bine la afișarea acestui conținut. Încearcă din
              nou.
            </p>
            <Button className="w-full" onClick={this.handleClose}>
              Închide
            </Button>
          </div>
        </Modal>
      );
    }
    return this.props.children;
  }
}
