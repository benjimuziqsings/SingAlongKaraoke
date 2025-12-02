
{
  description = "Sing A Long Karaoke Next.js App";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, deploy-rs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        name = "karaoke-dev-shell";
        buildInputs = with pkgs; [
          nodejs_20
          deploy-rs.packages.${system}.deploy-rs
        ];
      };

      deploy.nodes.karaokeApp = {
        hostname = "localhost";
        profiles.system.path = deploy-rs.lib.${system}.activate.nixos self.nixosConfigurations.karaoke;
      };

      nixosConfigurations.karaoke = nixpkgs.lib.nixosSystem {
        inherit system;
        modules = [({ pkgs, ... }: {
          deployment = {
            magicRollback = true;
            user = "root";
            targetHost = null;
            steps = [
              {
                # Install npm dependencies
                name = "npm-install";
                command = "npm install";
                path = [ pkgs.nodejs_20 ];
              }
              {
                # Build the Next.js application
                name = "npm-build";
                command = "npm run build";
                path = [ pkgs.nodejs_20 ];
              }
            ];
            service = {
              # Systemd service to run the app
              name = "singalong-karaoke";
              user = "root";
              # Use npm run start to launch the Next.js server
              exec = "npm run start";
              path = [ pkgs.nodejs_20 ];
            };
          };
        })];
      };
    };
}
