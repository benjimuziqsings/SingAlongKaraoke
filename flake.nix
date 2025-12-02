{
  description = "A Next.js application for karaoke song requests.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, deploy-rs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_20
          deploy-rs.packages.${system}.deploy-rs
        ];
      };

      packages.${system}.deploy = deploy-rs.lib.${system}.mkDeployment {
        inherit pkgs;
        deployment.name = "singalong-karaoke-deployment";

        steps = [
          {
            name = "Install Dependencies";
            run = "npm install";
          }
          {
            name = "Build Next.js App";
            run = "npm run build";
          }
        ];

        service = {
          exec = "npm run start";
          user = "root";
        };

        rollback = {
          magic = true;
        };
        magicRollback = true;
      };
    };
}
