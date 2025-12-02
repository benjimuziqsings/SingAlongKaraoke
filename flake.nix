{
  description = "A Next.js application for karaoke song requests.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    let
      deploy-lib = deploy-rs.lib."x86_64-linux";
    in
    {
      deploy = deploy-lib.activate.nixos self.nixosConfigurations.karaoke;

      nixosConfigurations.karaoke = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ({ pkgs, ... }: {
            deployment.magicRollback = true;
            deployment.rollback.magic = true;
          })
        ];
      };

      devShells."x86_64-linux".default =
        let
          pkgs = nixpkgs.legacyPackages."x86_64-linux";
        in
        pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs-20_x
            deploy-rs.packages."x86_64-linux".deploy-rs
          ];
        };
    };
}
