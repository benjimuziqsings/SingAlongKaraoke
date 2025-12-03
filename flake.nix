
{
  description = "Sing A Long Karaoke Deployment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, deploy-rs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        overlays = [ deploy-rs.overlays.default ];
      };
      
      # This is the correct way to define the deployment using the deploy-rs overlay.
      # The overlay makes `pkgs.mkDeployment` available.
      deployment = pkgs.mkDeployment {
        name = "sing-a-long-karaoke-deployment";
        
        # Specify the Node.js version and any other system dependencies here.
        packages = [
          pkgs.nodejs_20
        ];

        # Define the steps to build the Next.js application.
        build = {
          copy = [
            ./package.json
            ./package-lock.json
            ./next.config.js
            ./tsconfig.json
            ./src
            ./public
          ];
          
          # The command to install dependencies and build the app.
          # The --legacy-peer-deps flag is added to handle potential peer dependency conflicts.
          command = ''
            npm install --legacy-peer-deps
            npm run build
          '';
        };

        # Define the command to start the application.
        run = {
          command = ["npm", "start"];
          
          # Expose port 3000 for the Next.js server.
          ports = [3000];
        };
      };
    in
    {
      # This is the attribute the build system is looking for.
      packages.${system}.deploy = deployment;
    };
}
