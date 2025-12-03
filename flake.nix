
{
  description = "A basic Node.js development environment for a Next.js application.";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };
  outputs = { self, nixpkgs }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      buildInputs = [
        nixpkgs.legacyPackages.x86_64-linux.nodejs_20
        nixpkgs.legacyPackages.x86_64-linux.nodePackages.npm
      ];
    };
  };
}
