#!/bin/bash

#################################################################
# Curtains CLI Installation Script for macOS
# 
# This script will install everything needed to run Curtains:
# - Homebrew (if not present)
# - Node.js via Homebrew
# - Curtains CLI tool
#
# Usage: bash setup-curtains-mac.sh
#################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Detect shell and architecture
CURRENT_SHELL="${SHELL##*/}"
IS_APPLE_SILICON=false
if [[ "$(uname -m)" == "arm64" ]]; then
    IS_APPLE_SILICON=true
fi

# Helper functions
print_step() {
    echo -e "\n${BLUE}${BOLD}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to reload shell environment
reload_shell_env() {
    # Source shell configuration files based on current shell
    if [[ "$CURRENT_SHELL" == "zsh" ]]; then
        if [[ -f "$HOME/.zshrc" ]]; then
            source "$HOME/.zshrc" 2>/dev/null || true
        fi
    elif [[ "$CURRENT_SHELL" == "bash" ]]; then
        if [[ -f "$HOME/.bash_profile" ]]; then
            source "$HOME/.bash_profile" 2>/dev/null || true
        elif [[ -f "$HOME/.bashrc" ]]; then
            source "$HOME/.bashrc" 2>/dev/null || true
        fi
    fi
    
    # Ensure Homebrew is in PATH for Apple Silicon
    if [[ "$IS_APPLE_SILICON" == "true" ]] && [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f "/usr/local/bin/brew" ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    # Update PATH with common npm global bin directories
    NPM_PREFIX="$(npm config get prefix 2>/dev/null || echo '')"
    if [[ -n "$NPM_PREFIX" ]]; then
        export PATH="$NPM_PREFIX/bin:$PATH"
    fi
    
    # Also check common global npm paths
    if [[ -d "/usr/local/lib/node_modules/.bin" ]]; then
        export PATH="/usr/local/lib/node_modules/.bin:$PATH"
    fi
    if [[ -d "$HOME/.npm-global/bin" ]]; then
        export PATH="$HOME/.npm-global/bin:$PATH"
    fi
}

# Welcome message
echo -e "${BOLD}"
echo "==============================================="
echo "    Curtains CLI Installation for macOS"
echo "==============================================="
echo -e "${NC}"
echo "This script will install:"
echo "  • Homebrew (if needed)"
echo "  • Node.js and npm"
echo "  • Curtains CLI tool"
echo ""

# Check if running on macOS
print_step "Checking system requirements..."

if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is only for macOS."
    print_info "Your system appears to be: $OSTYPE"
    echo ""
    echo "For other operating systems, please install manually:"
    echo "  1. Install Node.js from https://nodejs.org"
    echo "  2. Run: npm install -g curtains"
    exit 1
fi

print_success "Running on macOS"

# Check for Homebrew
print_step "Checking for Homebrew..."

if command -v brew >/dev/null 2>&1; then
    print_success "Homebrew is already installed"
    print_info "Version: $(brew --version | head -1)"
    
    # Update Homebrew
    print_step "Updating Homebrew..."
    if brew update >/dev/null 2>&1; then
        print_success "Homebrew updated"
    else
        print_warning "Failed to update Homebrew, continuing anyway..."
    fi
else
    print_warning "Homebrew not found"
    
    # Ask user for permission to install Homebrew
    echo ""
    echo "Homebrew is required to install Node.js."
    read -p "Would you like to install Homebrew? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Installing Homebrew..."
        
        # Install Homebrew
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH based on architecture
        if [[ "$IS_APPLE_SILICON" == "true" ]] && [[ -f "/opt/homebrew/bin/brew" ]]; then
            print_info "Configuring Homebrew for Apple Silicon..."
            eval "$(/opt/homebrew/bin/brew shellenv)"
            
            # Add to shell configuration for permanent change (if not already present)
            if [[ "$CURRENT_SHELL" == "zsh" ]]; then
                if ! grep -q 'brew shellenv' "$HOME/.zshrc" 2>/dev/null; then
                    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zshrc"
                    print_info "Added Homebrew configuration to ~/.zshrc"
                else
                    print_info "Homebrew configuration already exists in ~/.zshrc"
                fi
            elif [[ "$CURRENT_SHELL" == "bash" ]]; then
                # Check bash_profile first (preferred on macOS)
                if [[ -f "$HOME/.bash_profile" ]]; then
                    if ! grep -q 'brew shellenv' "$HOME/.bash_profile" 2>/dev/null; then
                        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.bash_profile"
                        print_info "Added Homebrew configuration to ~/.bash_profile"
                    else
                        print_info "Homebrew configuration already exists in ~/.bash_profile"
                    fi
                elif [[ -f "$HOME/.bashrc" ]]; then
                    if ! grep -q 'brew shellenv' "$HOME/.bashrc" 2>/dev/null; then
                        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.bashrc"
                        print_info "Added Homebrew configuration to ~/.bashrc"
                    else
                        print_info "Homebrew configuration already exists in ~/.bashrc"
                    fi
                else
                    # Create bash_profile if neither exists
                    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.bash_profile"
                    print_info "Created ~/.bash_profile with Homebrew configuration"
                fi
            fi
        elif [[ -f "/usr/local/bin/brew" ]]; then
            print_info "Configuring Homebrew for Intel Mac..."
            eval "$(/usr/local/bin/brew shellenv)"
            
            # Add to shell configuration for permanent change (if not already present)
            if [[ "$CURRENT_SHELL" == "zsh" ]]; then
                if ! grep -q 'brew shellenv' "$HOME/.zshrc" 2>/dev/null; then
                    echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.zshrc"
                    print_info "Added Homebrew configuration to ~/.zshrc"
                else
                    print_info "Homebrew configuration already exists in ~/.zshrc"
                fi
            elif [[ "$CURRENT_SHELL" == "bash" ]]; then
                # Check bash_profile first (preferred on macOS)
                if [[ -f "$HOME/.bash_profile" ]]; then
                    if ! grep -q 'brew shellenv' "$HOME/.bash_profile" 2>/dev/null; then
                        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.bash_profile"
                        print_info "Added Homebrew configuration to ~/.bash_profile"
                    else
                        print_info "Homebrew configuration already exists in ~/.bash_profile"
                    fi
                elif [[ -f "$HOME/.bashrc" ]]; then
                    if ! grep -q 'brew shellenv' "$HOME/.bashrc" 2>/dev/null; then
                        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.bashrc"
                        print_info "Added Homebrew configuration to ~/.bashrc"
                    else
                        print_info "Homebrew configuration already exists in ~/.bashrc"
                    fi
                else
                    # Create bash_profile if neither exists
                    echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.bash_profile"
                    print_info "Created ~/.bash_profile with Homebrew configuration"
                fi
            fi
        fi
        
        # Reload environment to ensure brew is available
        reload_shell_env
        
        # Check if installation was successful
        if command -v brew >/dev/null 2>&1; then
            print_success "Homebrew installed and configured successfully"
        else
            print_error "Homebrew installation failed"
            echo ""
            echo "Please install Homebrew manually from: https://brew.sh"
            echo "Then run this script again."
            exit 1
        fi
    else
        print_error "Installation cancelled"
        echo ""
        echo "Homebrew is required to continue."
        echo "Please install it manually from: https://brew.sh"
        exit 1
    fi
fi

# Check for Node.js
print_step "Checking for Node.js..."

if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is already installed"
    print_info "Version: $NODE_VERSION"
    
    # Check if version is sufficient (v18 or higher recommended)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    if [[ $MAJOR_VERSION -lt 18 ]]; then
        print_warning "Node.js version is older than recommended (v18+)"
        echo ""
        read -p "Would you like to upgrade Node.js? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_step "Upgrading Node.js..."
            brew upgrade node
            print_success "Node.js upgraded"
        else
            print_info "Continuing with existing Node.js version"
        fi
    fi
else
    print_warning "Node.js not found"
    print_step "Installing Node.js via Homebrew..."
    
    if brew install node; then
        print_success "Node.js installed successfully"
        
        # Reload environment to ensure node and npm are available
        print_info "Refreshing PATH to include Node.js..."
        reload_shell_env
        
        # Verify node is now available
        if command -v node >/dev/null 2>&1; then
            print_info "Version: $(node --version)"
        else
            print_warning "Node.js installed but not in PATH yet"
            print_info "You may need to restart your terminal"
        fi
    else
        print_error "Failed to install Node.js"
        echo ""
        echo "Please try installing Node.js manually:"
        echo "  brew install node"
        echo "Or download from: https://nodejs.org"
        exit 1
    fi
fi

# Check npm is available
print_step "Checking for npm..."

if command -v npm >/dev/null 2>&1; then
    print_success "npm is available"
    print_info "Version: $(npm --version)"
else
    print_error "npm not found"
    echo ""
    echo "npm should have been installed with Node.js."
    echo "Please check your Node.js installation."
    exit 1
fi

# Ensure npm global binaries are in PATH before installing Curtains
print_step "Configuring npm global packages..."

NPM_PREFIX="$(npm config get prefix 2>/dev/null || echo '')"
if [[ -n "$NPM_PREFIX" ]]; then
    export PATH="$NPM_PREFIX/bin:$PATH"
    print_info "npm global prefix: $NPM_PREFIX"
fi

# Install or update Curtains CLI
print_step "Installing Curtains CLI..."

# Check if Curtains is already installed
if command -v curtains >/dev/null 2>&1; then
    print_info "Curtains is already installed"
    CURRENT_VERSION=$(curtains --version 2>/dev/null || echo "unknown")
    print_info "Current version: $CURRENT_VERSION"
    
    echo ""
    read -p "Would you like to update/reinstall Curtains? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Updating Curtains..."
        if npm install -g curtains@latest; then
            print_success "Curtains updated successfully"
        else
            print_error "Failed to update Curtains"
            print_info "Trying with sudo..."
            if sudo npm install -g curtains@latest; then
                print_success "Curtains updated successfully (with sudo)"
            else
                print_error "Failed to update Curtains"
                exit 1
            fi
        fi
    else
        print_info "Keeping existing Curtains installation"
    fi
else
    print_info "Installing Curtains for the first time..."
    
    if npm install -g curtains; then
        print_success "Curtains installed successfully"
        
        # Reload environment to ensure curtains is available
        print_info "Refreshing PATH to include Curtains..."
        reload_shell_env
    else
        print_error "Failed to install Curtains"
        print_info "Trying with sudo..."
        if sudo npm install -g curtains; then
            print_success "Curtains installed successfully (with sudo)"
            
            # Reload environment to ensure curtains is available
            print_info "Refreshing PATH to include Curtains..."
            reload_shell_env
        else
            print_error "Failed to install Curtains"
            echo ""
            echo "Installation failed. Please try manually:"
            echo "  npm install -g curtains"
            echo "Or with sudo:"
            echo "  sudo npm install -g curtains"
            exit 1
        fi
    fi
fi

# Final reload before verification
reload_shell_env

# Verify installation
print_step "Verifying Curtains installation..."

if command -v curtains >/dev/null 2>&1; then
    print_success "Curtains CLI is ready to use!"
    
    # Try to get version
    if CURTAINS_VERSION=$(curtains --version 2>/dev/null); then
        print_info "Version: $CURTAINS_VERSION"
    fi
else
    print_warning "Curtains command not found in current session"
    echo ""
    
    # Try to find where npm installed it
    NPM_PREFIX="$(npm config get prefix 2>/dev/null || echo '')"
    if [[ -n "$NPM_PREFIX" ]] && [[ -f "$NPM_PREFIX/bin/curtains" ]]; then
        print_info "Curtains was installed to: $NPM_PREFIX/bin/curtains"
        echo ""
        echo "The installation succeeded but the command is not in your current PATH."
        echo ""
        echo "Please do ONE of the following:"
        echo ""
        echo "Option 1: Restart your terminal and run:"
        echo -e "  ${BLUE}curtains --help${NC}"
        echo ""
        echo "Option 2: Run this command in your current terminal:"
        if [[ "$CURRENT_SHELL" == "zsh" ]]; then
            echo -e "  ${BLUE}source ~/.zshrc${NC}"
        elif [[ "$CURRENT_SHELL" == "bash" ]]; then
            echo -e "  ${BLUE}source ~/.bash_profile${NC}"
        else
            echo -e "  ${BLUE}export PATH=\"$NPM_PREFIX/bin:\$PATH\"${NC}"
        fi
        echo ""
        echo "Then run:"
        echo -e "  ${BLUE}curtains --help${NC}"
    else
        print_error "Could not locate Curtains installation"
        echo ""
        echo "Please try closing and reopening your terminal, then run:"
        echo -e "  ${BLUE}curtains --help${NC}"
    fi
    
    # Don't exit with error since installation likely succeeded
    exit 0
fi

# Success message and usage instructions
echo ""
echo -e "${GREEN}${BOLD}===============================================${NC}"
echo -e "${GREEN}${BOLD}    ✨ Installation Complete! ✨${NC}"
echo -e "${GREEN}${BOLD}===============================================${NC}"
echo ""
echo -e "${BOLD}Getting Started with Curtains:${NC}"
echo ""
echo "  1. Create a Markdown file for your presentation:"
echo -e "     ${BLUE}echo '# My First Slide' > presentation.md${NC}"
echo ""
echo "  2. Convert it to an HTML presentation:"
echo -e "     ${BLUE}curtains presentation.md${NC}"
echo ""
echo "  3. Open the generated HTML file in your browser:"
echo -e "     ${BLUE}open presentation.html${NC}"
echo ""
echo -e "${BOLD}Useful Commands:${NC}"
echo ""
echo "  • Show help and options:"
echo -e "     ${BLUE}curtains --help${NC}"
echo ""
echo "  • Specify output file:"
echo -e "     ${BLUE}curtains input.md -o output.html${NC}"
echo ""
echo "  • Use a custom theme:"
echo -e "     ${BLUE}curtains presentation.md --theme dark${NC}"
echo ""
echo -e "${BOLD}Learn More:${NC}"
echo "  • Documentation: https://github.com/chancegraff/curtains"
echo "  • Report issues: https://github.com/chancegraff/curtains/issues"
echo ""
echo -e "${GREEN}Happy presenting! 🎭${NC}"