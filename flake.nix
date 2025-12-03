{
  "description": "Karaoke Queue Master",
  "inputs": {
    "nixpkgs": {
      "url": "github:NixOS/nixpkgs/nixos-unstable"
    },
    "flake-utils": {
      "url": "github:numtide/flake-utils"
    }
  },
  "outputs": {
    "self": _,
    "nixpkgs": _,
    "flake-utils": flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells = {
          default = pkgs.mkShell {
            buildInputs = [
              pkgs.nodejs
            ];
          };
        };
      })
}
